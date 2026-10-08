import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, cleanResults } from '../../server/app.js'
import { memoryStore, postgresStore } from '../../server/store.js'
import { hashPassword, verifyPassword } from '../../server/auth.js'

// Starts the app on a free port and returns a tiny client that keeps its cookie.
async function startApp(store) {
  const server = createServer(createApp({ store, dist: '/nonexistent' }))
  await new Promise((resolve) => server.listen(0, resolve))
  const base = `http://localhost:${server.address().port}`
  let cookie = ''
  const call = async (method, url, body, headers = {}) => {
    const response = await fetch(base + url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    return { status: response.status, body: await response.json(), setCookie }
  }
  return { call, close: () => new Promise((resolve) => server.close(resolve)), forget: () => { cookie = '' } }
}

test('passwords are hashed and verified', async () => {
  const stored = await hashPassword('correct horse')
  assert.doesNotMatch(stored, /correct horse/)
  assert.equal(await verifyPassword('correct horse', stored), true)
  assert.equal(await verifyPassword('wrong horse', stored), false)
})

test('results are cleaned before saving', () => {
  assert.deepEqual(cleanResults({ 1: { earned: 20, available: 30 }, 2: { earned: 40, available: 30 }, x: { earned: 1, available: 2 }, 3: null }), { 1: { earned: 20, available: 30 } })
})

test('without a database, accounts are off but the session check works', async () => {
  const app = await startApp(null)
  assert.deepEqual((await app.call('GET', '/api/session')).body, { accounts: false, user: null })
  assert.equal((await app.call('POST', '/api/login', { email: 'a@b.co', password: 'x' })).status, 503)
  await app.close()
})

async function accountFlow(store) {
  const app = await startApp(store)
  const email = `player${Date.now()}@example.com`

  assert.equal((await app.call('POST', '/api/signup', { email, password: 'short' })).status, 400)
  const signup = await app.call('POST', '/api/signup', { email: email.toUpperCase(), password: 'goal-line-tech' })
  assert.equal(signup.status, 200)
  assert.equal(signup.body.user.email, email)
  assert.match(signup.setCookie, /HttpOnly/)
  assert.match(signup.setCookie, /SameSite=Lax/)
  assert.equal((await app.call('POST', '/api/signup', { email, password: 'goal-line-tech' })).status, 409)

  // A guest's local results are copied in; the first score for a round is kept.
  await app.call('POST', '/api/results', { results: { 1: { earned: 10, available: 30 } } })
  const merged = await app.call('POST', '/api/results', { results: { 1: { earned: 30, available: 30 }, 2: { earned: 5, available: 29 } } })
  assert.deepEqual(merged.body.results, { 1: { earned: 10, available: 30 }, 2: { earned: 5, available: 29 } })

  await app.call('POST', '/api/logout', {})
  assert.equal((await app.call('GET', '/api/results')).status, 401)
  assert.equal((await app.call('POST', '/api/login', { email, password: 'wrong-password' })).status, 401)
  const login = await app.call('POST', '/api/login', { email, password: 'goal-line-tech' })
  assert.equal(login.status, 200)
  assert.deepEqual((await app.call('GET', '/api/session')).body, { accounts: true, user: { email } })
  assert.equal(Object.keys((await app.call('GET', '/api/results')).body.results).length, 2)

  app.forget()
  assert.deepEqual((await app.call('GET', '/api/session')).body.user, null)
  await app.close()
}

test('sign up, save results, sign out and back in', () => accountFlow(memoryStore()))

test('requests that are not JSON are refused', async () => {
  const app = await startApp(memoryStore())
  const form = await app.call('POST', '/api/login', undefined, { 'Content-Type': 'application/x-www-form-urlencoded' })
  assert.equal(form.status, 415)
  await app.close()
})

// Runs the same flow against a real database when TEST_DATABASE_URL is set.
test('account flow on Postgres', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const store = await postgresStore(process.env.TEST_DATABASE_URL)
  try {
    await accountFlow(store)
  } finally {
    await store.close()
  }
})
