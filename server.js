import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const port = process.env.PORT || 3000
const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, 'dist')
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

const server = createServer(async (request, response) => {
  const requestedPath = decodeURIComponent(request.url?.split('?')[0] || '/')
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
})

server.listen(port, () => {
  console.log(`Soccer Guessr listening on port ${port}`)
})