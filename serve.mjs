// Tiny static server. BASE=/eternal-horizon/ emulates the GitHub Pages sub-path.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = process.argv[2] || '.', base = (process.env.BASE || '/').replace(/\/?$/, '/'), port = +process.env.PORT || 8080;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
createServer(async (q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (!p.startsWith(base)) { r.writeHead(404); return r.end('Not found (outside base path ' + base + ')'); }
  p = p.slice(base.length) || 'index.html'; if (p.endsWith('/')) p += 'index.html';
  try { const f = join(root, normalize(p)); r.writeHead(200, { 'Content-Type': T[extname(f)] || 'application/octet-stream' }); r.end(await readFile(f)); }
  catch { r.writeHead(404); r.end('Not found'); }
}).listen(port, () => console.log(`http://localhost:${port}${base}`));
