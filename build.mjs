// Copies the static site to dist/ and verifies every local reference resolves (no broken paths).
import { cpSync, rmSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const FILES = ['index.html', 'manifest.webmanifest', 'icon.svg', 'src'];
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist');
for (const f of FILES) cpSync(f, join('dist', f), { recursive: true });
let bad = 0;
const check = (file, re) => { const t = readFileSync(file, 'utf8'); for (const m of t.matchAll(re)) { const ref = m[1]; if (/^(https?:|data:|#|\/\/)/.test(ref)) continue; if (ref.startsWith('/')) { console.error(`ABSOLUTE PATH in ${file}: ${ref}`); bad++; continue; } if (!existsSync(resolve(dirname(file), ref))) { console.error(`MISSING in ${file}: ${ref}`); bad++; } } };
check('dist/index.html', /(?:src|href)="([^"]+)"/g);
for (const f of ['main', 'renderer', 'export', 'sun', 'settings']) check(`dist/src/${f}.js`, /from '([^']+)'/g);
check('dist/manifest.webmanifest', /"(?:src|start_url)":"([^"]+)"/g);
if (bad) { console.error(`Build failed: ${bad} bad reference(s)`); process.exit(1); }
console.log('Build OK → dist/ (all relative paths resolve; no absolute paths)');
