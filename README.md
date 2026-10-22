# ETERNAL HORIZON — live tropical beach wallpaper

Real-time WebGL2 scene (procedural sky, ocean, beach, palms, sun, moon, stars, clouds, aurora) with a continuous
simulated 24-hour cycle and **native tiled 8K / 4K / Full-HD export**. No runtime dependencies, no API keys, no CDN.

## Commands
```bash
npm start            # serve the source at http://localhost:8080/
npm run build        # copy to dist/ and verify every relative path resolves
npm run preview      # serve dist/ (BASE=/eternal-horizon/ npm run preview  → emulates GitHub Pages)
```
Needs Node ≥ 18 only for these helper scripts; the site itself is plain static files (any web server works).

## Deploy to GitHub Pages (https://<user>.github.io/eternal-horizon/)
1. Copy this folder's contents into the repository root (replace the old `index.html`), commit, push to `main`.
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included
   `.github/workflows/pages.yml` builds and publishes `dist/`.
3. All URLs are relative, so the `/eternal-horizon/` sub-path works with no configuration.

## Layout
`src/shader.js` sky/ocean/beach/palms/moon/stars/clouds/aurora (GLSL) · `src/renderer.js` WebGL2 setup, context-loss handling ·
`src/sun.js` sun & moon placement and time-of-day label · `src/export.js` tiled high-resolution export ·
`src/settings.js` localStorage persistence (fails gracefully) · `src/main.js` UI, clock, quality presets, loop.

## Notes & limits
- The cycle is a **simulated artistic** one: elevation/azimuth come from spherical astronomy (latitude + date), then are
  compressed so the sun and moon stay in frame. It is not an ephemeris.
- Visuals are fully procedural (no photo textures). It is a high-quality stylised-realistic render, not photographic footage.
- Not implemented: cast shadows from palms, volumetric 3D clouds (clouds are a lit 2D noise layer), true bloom post-processing.
- Export renders 1280×720 tiles (960×540 for 1080p) into one canvas; 8K needs ≈130 MB of canvas memory. If the device cannot
  allocate or encode it, the app automatically tries 4K then Full HD and tells you. Output size is decoded and verified after encoding.
