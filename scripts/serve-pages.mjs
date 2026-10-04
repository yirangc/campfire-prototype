// Serves dist/ the way GitHub Pages serves a project site: under /<repo>/, with a 301 from a folder URL without its
// trailing slash, index.html for folders and a plain 404 for anything else. No SPA fallback, same as Pages.
// Usage: node scripts/serve-pages.mjs [port] [base]   (defaults: 4174, /campfire-prototype/)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const port = Number(process.argv[2] ?? 4174)
const base = process.argv[3] ?? '/campfire-prototype/'
const root = new URL('../dist/', import.meta.url).pathname
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

const send = (res, code, body = '', headers = {}) => {
  res.writeHead(code, headers)
  res.end(body)
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path === base.slice(0, -1)) return send(res, 301, '', { Location: base })
  if (!path.startsWith(base)) return send(res, 404, 'Not found')
  const file = normalize(join(root, path.slice(base.length)))
  if (!file.startsWith(root)) return send(res, 404, 'Not found')
  try {
    const info = await stat(file)
    if (info.isDirectory()) {
      if (!path.endsWith('/')) return send(res, 301, '', { Location: `${path}/` })
      return send(res, 200, await readFile(join(file, 'index.html')), { 'Content-Type': types['.html'] })
    }
    send(res, 200, await readFile(file), { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  } catch {
    send(res, 404, 'Not found')
  }
}).listen(port, () => console.log(`dist/ at http://localhost:${port}${base}`))
