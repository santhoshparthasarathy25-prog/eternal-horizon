// Sun travels from the left horizon at sunrise to its highest point near noon,
// then down to the right horizon at sunset. Moon follows a separate night arc.
// This is a stylized scene model, not an astronomical ephemeris.
const D = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);

function solarBody(H, lat, dec) {
  const sinE = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const elev = Math.asin(clamp(sinE, -1, 1));
  const A = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  // Do not compress elevation: the sun now climbs higher into the sky at noon.
  const az = A * 0.27;
  return { elevDeg: elev / D, dir: [Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)] };
}

function lunarBody(minutes, lat) {
  // Stylized daily arc: rises around sunset, reaches its peak around midnight,
  // and descends toward sunrise. Moon phase affects illumination, not its path.
  const H = ((minutes - 1440) / 720) * Math.PI;
  const elev = Math.acos(-1) / 2 * Math.cos(H) * (0.88 + 0.12 * Math.cos(lat));
  const horizontal = Math.cos(elev);
  const x = Math.sin(H) * horizontal;
  const z = 0.18 * horizontal + 0.12 * Math.sin(lat);
  const len = Math.hypot(x, Math.sin(elev), z) || 1;
  return [x / len, Math.sin(elev) / len, z / len];
}

export function skyState({ minutes, latDeg, dayN, phase }) {
  const lat = clamp(latDeg, -66, 66) * D;
  const dec = 23.44 * D * Math.sin(2 * Math.PI * (284 + dayN) / 365);
  const H = (minutes / 60 - 12) * 15 * D;
  const sun = solarBody(H, lat, dec);
  const moon = lunarBody(minutes, lat);
  // New moon near 0, full moon near 0.5, new moon again near 1.
  const moonLit = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
  return { sun: sun.dir, moon, elevDeg: sun.elevDeg, moonLit };
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
