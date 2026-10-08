import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../../server/app.js'
import { memoryStore, postgresStore } from '../../server/store.js'
import { googleAccount } from '../../server/google.js'

const google = { clientId: 'client-123', clientSecret: 'secret' }
const claimsFor = (sub, email, extra = {}) => ({ iss: 'https://accounts.google.com', aud: google.clientId, exp: Date.now() / 1000 + 600, sub, email, email_verified: true, ...extra })

// Starts the app with a fake Google token endpoint that returns `nextClaims`.
async function startApp(store) {
  const fake = { nextClaims: null, calls: [] }
  const exchangeCode = async (args) => {
    fake.calls.push(args)
    return fake.nextClaims
  }
  const server = createServer(createApp({ store, dist: '/nonexistent', google, exchangeCode }))
  await new Promise((resolve) => server.listen(0, resolve))
  const base = `http://localhost:${server.address().port}`
  const get = (url, cookie = '') => fetch(base + url, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} })
  const json = async (method, url, cookie, body) => (await fetch(base + url, { method, headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body && JSON.stringify(body) })).json()
  const cookieValue = (response, name) => response.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith(`${name}=`) && c.length > name.length + 1)

  // Runs the whole round trip and returns the session cookie (or the failure redirect).
  async function signIn(claims) {
    fake.nextClaims = claims
    const start = await get('/api/auth/google')
    assert.equal(start.status, 302)
    const location = new URL(start.headers.get('location'))
    assert.equal(location.host, 'accounts.google.com')
    assert.equal(location.searchParams.get('client_id'), google.clientId)
    assert.equal(location.searchParams.get('redirect_uri'), `${base}/api/auth/google/callback`)
    const state = location.searchParams.get('state')
    const back = await get(`/api/auth/google/callback?code=abc&state=${state}`, cookieValue(start, 'sg_google_state'))
    assert.equal(back.status, 302)
    return { location: back.headers.get('location'), session: cookieValue(back, 'sg_session') }
  }
  return { fake, get, json, signIn, close: () => new Promise((resolve) => { server.close(resolve); server.closeAllConnections() }) }
}

test('Google claims are only accepted when they are for us and the email is verified', () => {
  assert.deepEqual(googleAccount(claimsFor('1', 'A@Example.com'), google.clientId), { googleId: '1', email: 'a@example.com' })
  assert.equal(googleAccount(claimsFor('1', 'a@example.com', { aud: 'someone-else' }), google.clientId), null)
  assert.equal(googleAccount(claimsFor('1', 'a@example.com', { email_verified: false }), google.clientId), null)
  assert.equal(googleAccount(claimsFor('1', 'a@example.com', { iss: 'https://evil.example' }), google.clientId), null)
  assert.equal(googleAccount(claimsFor('1', 'a@example.com', { exp: Date.now() / 1000 - 1 }), google.clientId), null)
})

async function googleFlow(store) {
  const app = await startApp(store)
  const email = `google${Date.now()}@example.com`

  // A brand-new Google player gets an account and lands back on the game.
  const first = await app.signIn(claimsFor(`sub-${email}`, email))
  assert.equal(first.location, '/')
  assert.ok(first.session)
  assert.deepEqual((await app.json('GET', '/api/session', first.session)).user, { email })
  assert.equal((await app.json('GET', '/api/session', '')).google, true)

  // Signing in again reaches the same account, scores included.
  await app.json('POST', '/api/results', first.session, { results: { 3: { earned: 9, available: 30 } } })
  const again = await app.signIn(claimsFor(`sub-${email}`, email))
  assert.deepEqual((await app.json('GET', '/api/results', again.session)).results, { 3: { earned: 9, available: 30 } })

  // A different Google account with the same email can't take it over.
  assert.equal((await app.signIn(claimsFor('someone-else', email))).location, '/?signin=google-taken')

  // Unverified emails and a missing or wrong state are refused.
  assert.equal((await app.signIn(claimsFor('x', 'x@example.com', { email_verified: false }))).location, '/?signin=google-failed')
  const forged = await app.get('/api/auth/google/callback?code=abc&state=guess', 'sg_google_state=other')
  assert.equal(forged.headers.get('location'), '/?signin=google-failed')
  await app.close()
}

test('Google sign-in creates, reuses and protects accounts', () => googleFlow(memoryStore()))

test('Google sign-in joins an existing email and password account', async () => {
  const store = memoryStore()
  const app = await startApp(store)
  await store.createUser('both@example.com', 'scrypt$x$y')
  const { session } = await app.signIn(claimsFor('sub-both', 'both@example.com'))
  assert.deepEqual((await app.json('GET', '/api/session', session)).user, { email: 'both@example.com' })
  assert.equal((await store.findUserByEmail('both@example.com')).passwordHash, 'scrypt$x$y')
  await app.close()
})

test('Google sign-in on Postgres', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const store = await postgresStore(process.env.TEST_DATABASE_URL)
  try {
    await googleFlow(store)
    await store.createUser('pg-both@example.com', 'scrypt$x$y').catch(() => {})
    assert.deepEqual(await store.signInWithGoogle(`pg-${Date.now()}`, 'pg-both@example.com').then((user) => user?.email), 'pg-both@example.com')
  } finally {
    await store.close()
  }
})
