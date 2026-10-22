const KEY = 'eternal-horizon:v1';
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches;
export const DEFAULTS = { speed: 1, quality: coarse ? 'low' : 'balanced', waves: 1, stars: 1, phase: 0.5, clouds: 0.5, aurora: 0, lat: 15, size: coarse ? '4k' : '8k', fmt: 'png' };
export let storageOk = true;
export function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { storageOk = false; return { ...DEFAULTS }; }
}
export function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { storageOk = false; } }
export function clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
