import { createRenderer } from './renderer.js';
import { skyState, label, dayOfYear } from './sun.js';
import { load, save, clear, DEFAULTS, storageOk } from './settings.js';
import { exportWallpaper } from './export.js';

const $ = id => document.getElementById(id);
const PRESETS = { low: { scale: .5, oct: 4, aa: 1 }, balanced: { scale: .75, oct: 5, aa: 1 }, high: { scale: 1, oct: 7, aa: 1 }, ultra: { scale: 1, oct: 8, aa: 2 } };
const canvas = $('scene');
let S = load(), minutes = 360, live = true, paused = false, animT = 0, last = performance.now(), renderer, dayN = dayOfYear(new Date()), dragging = false, raf = 0;
let toastTimer = 0, lastKey = '';
const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4000); };
const fatal = m => { $('loading').hidden = true; $('fatal').hidden = false; $('fatal').innerHTML = '<h2>ETERNAL HORIZON</h2><p></p>'; $('fatal').querySelector('p').textContent = m; };
const pad = n => String(n).padStart(2, '0');
const hhmm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.floor(m) % 60)}`;

function setMinutesNow() { const d = new Date(); minutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 6e4; }
function persist() { save(S); }
function uniforms(extra = {}) {
  const sky = skyState({ minutes, latDeg: S.lat, dayN, phase: S.phase });
  const P = PRESETS[S.quality] || PRESETS.balanced;
  return { uSun: sky.sun, uMoon: sky.moon, uLit: sky.moonLit, uPhase: S.phase, uT: animT, uWave: S.waves, uStars: S.stars, uCloud: S.clouds, uAurora: S.aurora ? 1 : 0, uWind: 1, uAA: P.aa, uOct: P.oct, _sky: sky, ...extra };
}
function resize() {
  if (!renderer) return;
  const P = PRESETS[S.quality] || PRESETS.balanced, dpr = Math.min(window.devicePixelRatio || 1, 2) * P.scale;
  const w = Math.min(renderer.maxSize, Math.max(2, Math.round(canvas.clientWidth * dpr))), h = Math.min(renderer.maxSize, Math.max(2, Math.round(canvas.clientHeight * dpr)));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (!paused) {
    animT += dt;
    if (live && S.speed === 1) setMinutesNow(); else if (!dragging) minutes = (minutes + dt * S.speed / 60) % 1440;
  }
  draw();
}
function draw() {
  resize();
  const u = uniforms(), sky = u._sky; delete u._sky;
  u.uFull = [canvas.width, canvas.height]; u.uTile = [0, 0];
  const key = JSON.stringify(u);
  if (paused && key === lastKey) return;            // paused and unchanged: skip GPU work
  lastKey = key; renderer.draw(u);
  const sec = Math.floor(minutes * 60) % 60;
  $('clock').textContent = `${hhmm(minutes)}:${pad(sec)}`;
  $('tod').textContent = label(minutes, sky.elevDeg) + (live && S.speed === 1 ? ' · local time' : ' · simulated');
  if (!dragging) { $('time').value = Math.floor(minutes) % 1440; $('time_o').textContent = hhmm(minutes); }
  if ($('loading') && !$('loading').hidden) $('loading').hidden = true;
}

function syncUI() {
  $('quality').value = S.quality; $('speed').value = S.speed; $('expSize').value = S.size; $('expFmt').value = S.fmt; $('aurora').checked = !!S.aurora; $('lat').value = S.lat;
  for (const [id, k, f] of [['waves', 'waves', v => v.toFixed(1) + '×'], ['stars', 'stars', v => v.toFixed(1) + '×'], ['phase', 'phase', v => ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'][Math.round(v * 8) % 8]], ['clouds', 'clouds', v => Math.round(v * 100) + '%']]) { $(id).value = S[k]; $(id + '_o').textContent = f(+S[k]); }
  $('playBtn').textContent = paused ? 'Play' : 'Pause'; $('playBtn').setAttribute('aria-pressed', String(!paused));
  $('date').value = new Date(new Date().getFullYear(), 0, dayN).toISOString().slice(0, 10);
}
function wire() {
  const rng = (id, k, f) => $(id).addEventListener('input', e => { S[k] = +e.target.value; $(id + '_o').textContent = f(S[k]); persist(); });
  rng('waves', 'waves', v => v.toFixed(1) + '×'); rng('stars', 'stars', v => v.toFixed(1) + '×'); rng('clouds', 'clouds', v => Math.round(v * 100) + '%');
  rng('phase', 'phase', v => ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'][Math.round(v * 8) % 8]);
  $('time').addEventListener('input', e => { dragging = true; live = false; minutes = +e.target.value; $('time_o').textContent = hhmm(minutes); });
  $('time').addEventListener('change', () => { dragging = false; });
  $('nowBtn').onclick = () => { live = true; S.speed = 1; $('speed').value = 1; paused = false; setMinutesNow(); syncUI(); toast('Following your device clock'); persist(); };
  $('playBtn').onclick = () => { paused = !paused; syncUI(); };
  $('speed').addEventListener('change', e => { S.speed = +e.target.value; if (S.speed !== 1) live = false; persist(); });
  $('quality').addEventListener('change', e => { S.quality = e.target.value; persist(); });
  $('aurora').addEventListener('change', e => { S.aurora = e.target.checked ? 1 : 0; persist(); });
  $('lat').addEventListener('change', e => { S.lat = Math.max(-66, Math.min(66, +e.target.value || 0)); e.target.value = S.lat; persist(); });
  $('date').addEventListener('change', e => { const d = new Date(e.target.value + 'T12:00:00'); if (!isNaN(d)) dayN = dayOfYear(d); });
  $('expSize').addEventListener('change', e => { S.size = e.target.value; persist(); });
  $('expFmt').addEventListener('change', e => { S.fmt = e.target.value; persist(); });
  $('panelBtn').onclick = () => { const p = $('panel'); p.hidden = !p.hidden; $('panelBtn').setAttribute('aria-expanded', String(!p.hidden)); };
  $('fsBtn').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { toast('Fullscreen is not supported here. On iPhone use Share → Add to Home Screen.'); }
  };
  $('resetBtn').onclick = () => { clear(); S = { ...DEFAULTS }; live = true; paused = false; dayN = dayOfYear(new Date()); setMinutesNow(); syncUI(); toast('Settings reset'); };
  $('expBtn').onclick = runExport;
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); renderer && renderer.dispose(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } });
}
async function runExport() {
  const btn = $('expBtn'), bar = $('expBar'); btn.disabled = true; bar.hidden = false; bar.value = 0; $('expMsg').textContent = 'Rendering tiles…';
  const was = paused; paused = true;                           // freeze the scene at the selected time
  try {
    const u = uniforms(); delete u._sky;
    const r = await exportWallpaper({ size: S.size, fmt: S.fmt, uniforms: u, onProgress: p => { bar.value = p; $('expMsg').textContent = `Rendering… ${Math.round(p * 100)}%`; } });
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = r.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 6e4);
    $('expMsg').textContent = `Saved ${r.name} — verified ${r.width}×${r.height}, ${(r.blob.size / 1048576).toFixed(1)} MB` + (r.fellBack ? `. Fell back from ${S.size.toUpperCase()}: ${r.fellBack.join('; ')}` : '');
    window.__lastExport = { width: r.width, height: r.height, bytes: r.blob.size, name: r.name, fellBack: r.fellBack };
  } catch (e) { $('expMsg').textContent = e.message; }
  finally { paused = was; btn.disabled = false; bar.hidden = true; }
}
function boot() {
  try {
    renderer = createRenderer(canvas, { onLost: () => toast('Graphics context lost — restoring…'), onRestored: () => toast('Graphics restored'), onError: e => fatal(e.message) });
  } catch (e) { fatal(e.message); return; }
  setMinutesNow(); syncUI(); wire();
  if (matchMedia('(max-width:620px)').matches) { $('panel').hidden = true; $('panelBtn').setAttribute('aria-expanded', 'false'); }
  if (!storageOk) toast('Settings cannot be saved in this browser mode.');
  raf = requestAnimationFrame(frame);
}
boot();
window.__EH = { get minutes() { return minutes; }, canvas };   // read-only debug handle used by the test suite
