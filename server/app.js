import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { hashPassword, hashToken, newSessionToken, verifyPassword } from './auth.js'
import { exchangeGoogleCode, googleAccount, googleAuthUrl } from './google.js'

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

const COOKIE = 'sg_session'
const SESSION_DAYS = 30
const MIN_PASSWORD = 8
const MAX_BODY = 64 * 1024
// Sign-in and sign-up attempts allowed per IP address per 15 minutes.
const AUTH_ATTEMPTS = 20
const AUTH_WINDOW = 15 * 60 * 1000

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const validEmail = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function readCookie(request, name) {
  for (const part of (request.headers.cookie || '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

const sameString = (a, b) => Boolean(a && b) && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

function sessionCookie(token, secure, maxAge) {
  return [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`, ...(secure ? ['Secure'] : [])].join('; ')
}

// Only accept JSON bodies: browsers can't send them cross-site without a CORS
// preflight, which this server never approves, so the cookie can't be ridden (CSRF).
async function readJson(request) {
  if (!String(request.headers['content-type']).startsWith('application/json')) throw new HttpError(415, 'Send JSON.')
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > MAX_BODY) throw new HttpError(413, 'Request too large.')
  }
  try {
    return JSON.parse(body || '{}')
  } catch {
    throw new HttpError(400, 'Invalid JSON.')
  }
}

// Keeps only well-formed { [round]: { earned, available, steps } } entries. steps, the points
// won on each question, is optional (older results don't have it) and dropped if it doesn't add up.
export function cleanResults(results) {
  const clean = {}
  if (!results || typeof results !== 'object') return clean
  for (const [round, result] of Object.entries(results)) {
    const number = Number(round)
    const { earned, available, steps } = result || {}
    if (!Number.isInteger(number) || number < 1 || number > 100000) continue
    if (!Number.isInteger(available) || available < 1 || available > 1000) continue
    if (!Number.isInteger(earned) || earned < 0 || earned > available) continue
    const validSteps = Array.isArray(steps) && steps.length <= 20 && steps.every((points) => Number.isInteger(points) && points >= 0)
      && steps.reduce((sum, points) => sum + points, 0) === earned
    clean[number] = validSteps ? { earned, available, steps } : { earned, available }
  }
  return clean
}

// Served on the old address when a player opens a page there. Guest scores live in that
// address's localStorage, which the new address can't read, so the page hands them over in the
// URL fragment (never sent to a server) and the new address saves them (src/transfer.js).
function handOffPage(canonicalHost) {
  const host = JSON.stringify(canonicalHost).replaceAll('<', '\\u003c')
  return `<!doctype html>
<meta charset="utf-8">
<title>Soccer Guessr has moved</title>
<noscript><meta http-equiv="refresh" content="0; url=https://${canonicalHost}/"></noscript>
<p>Soccer Guessr has moved to <a id="next" href="https://${canonicalHost}/">${canonicalHost}</a>.</p>
<script>
  var target = 'https://' + ${host} + location.pathname + location.search
  try {
    var data = {}
    ;['soccer-guessr:results', 'soccer-guessr:progress'].forEach(function (key) {
      var value = localStorage.getItem(key)
      if (value) data[key] = JSON.parse(value)
    })
    if (Object.keys(data).length) {
      target += '#sg-transfer=' + encodeURIComponent(JSON.stringify(data)) + '&hash=' + encodeURIComponent(location.hash)
    }
  } catch (error) {}
  location.replace(target.indexOf('#') < 0 ? target + location.hash : target)
</script>
`
}

// canonicalHost: when set, every other host name redirects there (the old herokuapp.com address,
// the bare domain without www). Pages get the hand-off above; everything else a plain redirect.
// google: { clientId, clientSecret } turns on "Sign in with Google"; exchangeCode is replaceable for tests.
export function createApp({ store, dist, secureCookies = false, canonicalHost = null, google = null, exchangeCode = exchangeGoogleCode }) {
  const attempts = new Map()

  function limitAuthAttempts(request) {
    // Heroku's router appends the real client address last; earlier entries can be forged.
    const ip = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress).split(',').at(-1).trim()
    const now = Date.now()
    const recent = (attempts.get(ip) || []).filter((time) => now - time < AUTH_WINDOW)
    if (recent.length >= AUTH_ATTEMPTS) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')
    attempts.set(ip, [...recent, now])
  }

  async function currentUser(request) {
    const token = readCookie(request, COOKIE)
    return token && store ? store.findSessionUser(hashToken(token)) : null
  }

  async function startSession(response, user) {
    const token = newSessionToken()
    await store.createSession(hashToken(token), user.id, new Date(Date.now() + SESSION_DAYS * 86400000))
    response.setHeader('Set-Cookie', sessionCookie(token, secureCookies, SESSION_DAYS * 86400))
  }

  async function credentials(request) {
    limitAuthAttempts(request)
    const { email, password } = await readJson(request)
    const cleanEmail = normalizeEmail(email)
    if (!validEmail(cleanEmail)) throw new HttpError(400, 'Enter a valid email address.')
    if (typeof password !== 'string' || !password) throw new HttpError(400, 'Enter a password.')
    if (password.length > 200) throw new HttpError(400, 'That password is too long.')
    return { email: cleanEmail, password }
  }

  async function requireUser(request) {
    const user = await currentUser(request)
    if (!user) throw new HttpError(401, 'Sign in first.')
    return user
  }

  // Google sign-in is a pair of page navigations, not JSON calls: /api/auth/google sends the
  // player to Google, and Google sends them back to the callback, which signs them in and
  // returns to the game. A random state value in a short-lived cookie ties the two together.
  const STATE_COOKIE = 'sg_google_state'
  const stateCookie = (value, maxAge) => [`${STATE_COOKIE}=${value}`, 'Path=/api/auth/google', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`, ...(secureCookies ? ['Secure'] : [])].join('; ')

  function googleRedirectUri(request) {
    const host = canonicalHost || request.headers.host
    const protocol = canonicalHost || secureCookies ? 'https' : 'http'
    return `${protocol}://${host}/api/auth/google/callback`
  }

  function redirect(response, location, cookies = []) {
    response.writeHead(302, { Location: location, 'Cache-Control': 'no-store', ...(cookies.length ? { 'Set-Cookie': cookies } : {}) })
    response.end()
  }

  async function handleGoogle(request, response, pathname) {
    if (request.method !== 'GET' || !store || !google) return redirect(response, '/')
    if (pathname === '/api/auth/google') {
      const state = randomBytes(24).toString('base64url')
      return redirect(response, googleAuthUrl({ clientId: google.clientId, redirectUri: googleRedirectUri(request), state }), [stateCookie(state, 600)])
    }
    const clearState = stateCookie('', 0)
    const failed = (reason) => redirect(response, `/?signin=${reason}`, [clearState])
    try {
      const params = new URL(request.url, 'http://localhost').searchParams
      if (!params.get('code') || !sameString(params.get('state'), readCookie(request, STATE_COOKIE))) return failed('google-failed')
      const claims = await exchangeCode({ clientId: google.clientId, clientSecret: google.clientSecret, redirectUri: googleRedirectUri(request), code: params.get('code') })
      const account = googleAccount(claims, google.clientId)
      if (!account) return failed('google-failed')
      const user = await store.signInWithGoogle(account.googleId, account.email)
      if (!user) return failed('google-taken')
      await startSession(response, user)
      response.setHeader('Set-Cookie', [response.getHeader('Set-Cookie'), clearState])
      response.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' })
      response.end()
    } catch (error) {
      console.error(error)
      failed('google-failed')
    }
  }

  const routes = {
    'GET /api/session': async (request) => {
      const user = await currentUser(request)
      return { accounts: Boolean(store), google: Boolean(store && google), user: user && { email: user.email } }
    },
    'POST /api/signup': async (request, response) => {
      const { email, password } = await credentials(request)
      if (password.length < MIN_PASSWORD) throw new HttpError(400, `Use at least ${MIN_PASSWORD} characters for your password.`)
      const user = await store.createUser(email, await hashPassword(password))
      if (!user) throw new HttpError(409, 'There is already an account with that email. Sign in instead.')
      await startSession(response, user)
      return { user: { email: user.email } }
    },
    'POST /api/login': async (request, response) => {
      const { email, password } = await credentials(request)
      const user = await store.findUserByEmail(email)
      if (!user || !(await verifyPassword(password, user.passwordHash))) throw new HttpError(401, 'Wrong email or password.')
      await startSession(response, user)
      return { user: { email: user.email } }
    },
    'POST /api/logout': async (request, response) => {
      const token = readCookie(request, COOKIE)
      if (token) await store.deleteSession(hashToken(token))
      response.setHeader('Set-Cookie', sessionCookie('', secureCookies, 0))
      return { user: null }
    },
    'GET /api/results': async (request) => {
      const user = await requireUser(request)
      return { results: await store.getResults(user.id) }
    },
    // Adds finished rounds (one, or a guest's whole history on sign-in). Rounds the
    // account already has keep their first score. Returns everything saved.
    'POST /api/results': async (request) => {
      const user = await requireUser(request)
      const { results } = await readJson(request)
      await store.saveResults(user.id, cleanResults(results))
      return { results: await store.getResults(user.id) }
    },
  }

  async function handleApi(request, response, pathname) {
    try {
      const route = routes[`${request.method} ${pathname}`]
      if (!route) throw new HttpError(404, 'Not found.')
      if (!store && pathname !== '/api/session') throw new HttpError(503, 'Accounts are not set up on this server yet.')
      const body = await route(request, response)
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify(body))
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500
      if (status === 500) console.error(error)
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify({ error: status === 500 ? 'Something went wrong. Try again.' : error.message }))
    }
  }

  async function serveStatic(response, requestedPath) {
    // "/privacy" serves privacy.html when it exists, so pages get clean addresses.
    const cleanPage = path.extname(requestedPath) ? null : path.resolve(dist, `.${requestedPath}.html`)
    const relativePath = requestedPath === '/' ? '/index.html' : requestedPath
    const filePath = cleanPage && (await readFile(cleanPage).then(() => true, () => false)) ? cleanPage : path.resolve(dist, `.${relativePath}`)

    if (!filePath.startsWith(`${dist}${path.sep}`)) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    try {
      const body = await readFile(filePath)
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' })
      response.end(body)
    } catch {
      const fallback = await readFile(path.join(dist, 'index.html'))
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(fallback)
    }
  }

  return async (request, response) => {
    let pathname
    try {
      pathname = decodeURIComponent(request.url?.split('?')[0] || '/')
    } catch {
      response.writeHead(400)
      response.end('Bad request')
      return
    }
    const host = String(request.headers.host || '').split(':')[0].toLowerCase()
    if (canonicalHost && host !== canonicalHost) {
      // A page load on the old herokuapp.com address (not an asset or API call) may have guest
      // scores to carry across. Every other address, like the bare domain, never served the game,
      // so it gets a real redirect: crawlers such as Google's app review don't run the hand-off's
      // script and would otherwise see a "has moved" page instead of the site.
      if (host.endsWith('.herokuapp.com') && request.method === 'GET' && !pathname.startsWith('/api/') && !path.extname(pathname)) {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
        response.end(handOffPage(canonicalHost))
        return
      }
      response.writeHead(308, { Location: `https://${canonicalHost}${request.url}` })
      response.end()
      return
    }
    if (pathname === '/api/auth/google' || pathname === '/api/auth/google/callback') return handleGoogle(request, response, pathname)
    if (pathname.startsWith('/api/')) return handleApi(request, response, pathname)
    return serveStatic(response, pathname)
  }
}
