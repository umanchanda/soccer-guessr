import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

// Stored as "scrypt$<salt>$<hash>" so the format can change later without a migration.
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, expected] = String(stored).split('$')
  if (scheme !== 'scrypt' || !salt || !expected) return false
  const hash = await scryptAsync(password, Buffer.from(salt, 'base64'), KEY_LENGTH)
  const expectedBytes = Buffer.from(expected, 'base64')
  return expectedBytes.length === hash.length && timingSafeEqual(hash, expectedBytes)
}

// The cookie carries a random token; the database only keeps its hash, so a leaked
// sessions table can't be used to sign in.
export const newSessionToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token) => createHash('sha256').update(token).digest('hex')
