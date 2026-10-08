import pg from 'pg'

// Both stores expose the same methods. The server uses Postgres; tests use memory.
// saveResults keeps the first attempt at each round, like the browser does.

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS round_results (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    earned INTEGER NOT NULL,
    available INTEGER NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, round)
  );
`

export async function postgresStore(connectionString) {
  // Hosted databases like Neon require TLS with a verified certificate; a local one has none.
  const local = /@(localhost|127\.0\.0\.1)[:/]|^postgres(ql)?:\/\/\/|host=\//.test(connectionString)
  const pool = new pg.Pool({ connectionString, ssl: !local })
  await pool.query(SCHEMA)

  return {
    async createUser(email, passwordHash) {
      const { rows } = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING id, email',
        [email, passwordHash],
      )
      return rows[0] || null
    },
    async findUserByEmail(email) {
      const { rows } = await pool.query('SELECT id, email, password_hash AS "passwordHash" FROM users WHERE email = $1', [email])
      return rows[0] || null
    },
    async createSession(tokenHash, userId, expiresAt) {
      await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash, userId, expiresAt])
      await pool.query('DELETE FROM sessions WHERE expires_at < now()')
    },
    async findSessionUser(tokenHash) {
      const { rows } = await pool.query(
        'SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = $1 AND expires_at > now()',
        [tokenHash],
      )
      return rows[0] || null
    },
    async deleteSession(tokenHash) {
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash])
    },
    async getResults(userId) {
      const { rows } = await pool.query('SELECT round, earned, available FROM round_results WHERE user_id = $1', [userId])
      return Object.fromEntries(rows.map(({ round, earned, available }) => [round, { earned, available }]))
    },
    async saveResults(userId, results) {
      const entries = Object.entries(results)
      if (!entries.length) return
      await pool.query(
        `INSERT INTO round_results (user_id, round, earned, available)
         SELECT $1, * FROM unnest($2::int[], $3::int[], $4::int[])
         ON CONFLICT (user_id, round) DO NOTHING`,
        [userId, entries.map(([round]) => Number(round)), entries.map(([, r]) => r.earned), entries.map(([, r]) => r.available)],
      )
    },
    close: () => pool.end(),
  }
}

export function memoryStore() {
  const users = []
  const sessions = new Map()
  const results = new Map()

  return {
    async createUser(email, passwordHash) {
      if (users.some((user) => user.email === email)) return null
      const user = { id: users.length + 1, email, passwordHash }
      users.push(user)
      return { id: user.id, email }
    },
    async findUserByEmail(email) {
      return users.find((user) => user.email === email) || null
    },
    async createSession(tokenHash, userId, expiresAt) {
      sessions.set(tokenHash, { userId, expiresAt })
    },
    async findSessionUser(tokenHash) {
      const session = sessions.get(tokenHash)
      if (!session || session.expiresAt <= new Date()) return null
      const { id, email } = users.find((user) => user.id === session.userId)
      return { id, email }
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash)
    },
    async getResults(userId) {
      return { ...results.get(userId) }
    },
    async saveResults(userId, incoming) {
      results.set(userId, { ...incoming, ...results.get(userId) })
    },
    async close() {},
  }
}
