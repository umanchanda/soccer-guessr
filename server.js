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

const app = createApp({ store, dist: path.join(root, 'dist'), secureCookies: process.env.NODE_ENV === 'production' })

createServer(app).listen(port, () => {
  console.log(`Soccer Guessr listening on port ${port}`)
})
