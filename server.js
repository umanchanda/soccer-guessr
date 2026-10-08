import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './server/app.js'
import { postgresStore } from './server/store.js'

const port = process.env.PORT || 3000
const root = path.dirname(fileURLToPath(import.meta.url))

// Accounts need a database. Without DATABASE_URL the game still runs and everyone plays as a guest.
const store = process.env.DATABASE_URL ? await postgresStore(process.env.DATABASE_URL) : null
if (!store) console.warn('DATABASE_URL is not set: sign-in is turned off and scores stay in the browser.')

// The address players should use, e.g. www.soccerguessr.com. Other addresses redirect to it.
const canonicalHost = process.env.CANONICAL_HOST?.trim().toLowerCase() || null

// "Sign in with Google" appears once both values from the Google Cloud OAuth client are set.
const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? { clientId: process.env.GOOGLE_CLIENT_ID.trim(), clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim() }
  : null

const app = createApp({ store, dist: path.join(root, 'dist'), secureCookies: process.env.NODE_ENV === 'production', canonicalHost, google })

createServer(app).listen(port, () => {
  console.log(`Soccer Guessr listening on port ${port}`)
})
