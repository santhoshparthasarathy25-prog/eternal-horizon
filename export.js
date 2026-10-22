import { createRenderer } from './renderer.js';
// [width, height, supersampling grid]. Native 8K needs little SSAA; smaller sizes get more.
export const SIZES = { '8k': [7680, 4320, 1], '4k': [3840, 2160, 2], '1080': [1920, 1080, 3] };
const ORDER = ['8k', '4k', '1080'];
const tick = () => new Promise(r => setTimeout(r, 0));

async function renderOne(key, fmt, uniforms, onProgress) {
  const [w, h, aa] = SIZES[key];
  const cols = Math.ceil(w / 1280), tw = w / cols, th = h / cols;       // tiles: 1280x720 (960x540 for 1080p)
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d', { alpha: false });
  if (!ctx || out.width !== w || out.height !== h) throw new Error(`this device cannot allocate a ${w}×${h} canvas`);
  const tile = document.createElement('canvas'); tile.width = tw; tile.height = th;
  const r = createRenderer(tile);
  try {
    const total = cols * cols; let n = 0;
    for (let ty = 0; ty < cols; ty++) for (let tx = 0; tx < cols; tx++) {
      r.draw({ ...uniforms, uFull: [w, h], uTile: [tx * tw, ty * th], uAA: aa, uOct: 8 });
      ctx.drawImage(tile, 0, 0, tw, th, tx * tw, h - (ty + 1) * th, tw, th);
      onProgress(++n / total); await tick();
    }
    const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise(res => out.toBlob(res, mime, 0.95));
    if (!blob) throw new Error('the browser could not encode the image (out of memory?)');
    const bmp = await createImageBitmap(blob);              // verify real decoded dimensions
    const ok = bmp.width === w && bmp.height === h; const dims = [bmp.width, bmp.height]; bmp.close();
    if (!ok) throw new Error(`encoded size ${dims.join('×')} did not match ${w}×${h}`);
    return { blob, width: w, height: h, fmt, name: `eternal-horizon-${w}x${h}.${fmt === 'jpeg' ? 'jpg' : 'png'}` };
  } finally { r.dispose(); out.width = out.height = 0; }
}

export async function exportWallpaper({ size, fmt, uniforms, onProgress }) {
  const errors = [];
  for (let i = ORDER.indexOf(size); i < ORDER.length; i++) {
    try { const res = await renderOne(ORDER[i], fmt, uniforms, onProgress); res.fellBack = ORDER[i] !== size ? errors : null; return res; }
    catch (e) { errors.push(`${ORDER[i].toUpperCase()}: ${e.message}`); }
  }
  throw new Error('Export failed. ' + errors.join(' | '));
}
