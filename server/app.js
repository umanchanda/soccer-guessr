import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { hashPassword, hashToken, newSessionToken, verifyPassword } from './auth.js'

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

export function createApp({ store, dist, secureCookies = false }) {
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

  const routes = {
    'GET /api/session': async (request) => {
      const user = await currentUser(request)
      return { accounts: Boolean(store), user: user && { email: user.email } }
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
    const relativePath = requestedPath === '/' ? '/index.html' : requestedPath
    const filePath = path.resolve(dist, `.${relativePath}`)

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
    if (pathname.startsWith('/api/')) return handleApi(request, response, pathname)
    return serveStatic(response, pathname)
  }
}
