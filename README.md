# Eternal Horizon — Natural Horizon

A real-time WebGL2 ocean-horizon scene with changing sky light, procedural clouds, sun, moon, stars, moving water and an adjustable day-to-night cycle. The foreground is kept open to emphasize the natural horizon.

## Run locally

Requires Node.js 18 or newer.

```bash
npm start
```

Open the local URL printed by the server. To build and preview the static deployment output:

```bash
npm run build
npm run preview
```

No API keys or runtime package installation are required.

## Controls

- Follow your device's local time or choose a time manually.
- Pause or accelerate the day/night cycle.
- Adjust latitude and date for an approximate seasonal sun path.
- Change rendering quality, wave intensity, cloud cover, star density and moon phase.
- Export wallpaper at Full HD, 4K or 8K (large exports depend on available browser/GPU memory).

## Deployment

The GitHub Actions workflow at `.github/workflows/pages.yml` builds the site and deploys the `dist/` directory to GitHub Pages on pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the deployment source if required.

## Project structure

- `index.html` — website and controls
- `src/main.js` — interface, animation and settings
- `src/shader.js` — WebGL fragment shader for sky, clouds, sun/moon and ocean
- `src/renderer.js` — WebGL2 renderer
- `src/sun.js` — approximate sun/moon positioning and day labels
- `src/export.js` — tiled wallpaper export
- `src/settings.js` — local settings persistence
- `src/style.css` — interface styling
- `scripts/build.mjs` — copies and validates deployment assets
- `scripts/serve.mjs` — local static server

## Visual limitations

This is procedural graphics, not nature footage or a photorealistic photograph. Cloud formations are generated from noise rather than volumetric 3D simulation, and the sun/moon paths are approximate. The result can be made more natural-looking, but true photographic realism requires further rendering work and visual testing across devices.
