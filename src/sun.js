// Approximate solar/lunar placement; see README for modelling limits.
const D = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
function body(H, lat, dec, k) {
  const sinE = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const elev = Math.asin(clamp(sinE, -1, 1));
  const A = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  const e = elev < 0 ? elev : elev * k, az = A * 0.27;
  return { elevDeg: elev / D, dir: [Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e)] };
}
export function skyState({ minutes, latDeg, dayN, phase }) {
  const lat = clamp(latDeg, -66, 66) * D, dec = 23.44 * D * Math.sin(2 * Math.PI * (284 + dayN) / 365);
  const H = (minutes / 60 - 12) * 15 * D;
  const sun = body(H, lat, dec, 0.5), moon = body(H - phase * 2 * Math.PI, lat, 0, 0.3);
  return { sun: sun.dir, moon: moon.dir, elevDeg: sun.elevDeg, moonLit: 0.5 - 0.5 * Math.cos(2 * Math.PI * phase) };
}
export function label(minutes, e) {
  const am = minutes < 720;
  if (e < -12) return 'Night';
  if (e < -4) return am ? 'Dawn' : 'Twilight';
  if (e < 4) return am ? 'Sunrise' : 'Sunset';
  if (e < 18) return am ? 'Morning' : 'Golden hour';
  if (e < 50) return am ? 'Morning' : 'Afternoon';
  return 'Noon';
}
