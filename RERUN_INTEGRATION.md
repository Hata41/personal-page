# Rerun Integration Guide

This project includes a Rerun 3D viewer integrated with Astro and React.

## Critical Setup Requirements

### 1. Static Assets (`/public`)
The Rerun viewer is powered by a WebAssembly engine. Since Vite does not automatically bundle these assets in a way the viewer can discover them, they must be manually placed in the `public/` directory:
- `public/re_viewer_bg.wasm`
- `public/re_viewer.js`

If you update the `@rerun-io/web-viewer` version in `package.json`, you **must** copy the new versions from `node_modules/@rerun-io/web-viewer/` to `public/`.

### 2. Component Implementation
Use the core `@rerun-io/web-viewer` library instead of the React wrapper. The wrapper lacks support for the `base_url` parameter, which is essential for directing the viewer to the WASM file in your `public` folder.

**Key Initialization Pattern:**
```typescript
const viewer = new WebViewer();
const origin = window.location.origin;
await viewer.start(`${origin}/path/to/data.rrd`, containerElement, {
  base_url: `${origin}/`,
  // ... other options
});
```
*Note: Using relative paths like `/` will cause `Invalid URL` errors.*

### 3. Astro Page Integration
Rerun relies on browser APIs (WebGL, WASM, standard navigation) that are not available during Astro's build-time SSR/SSG.

Always render Rerun components using the `client:only` directive:
```astro
<RerunViewer3D client:only="react" />
```

## Adding New Data
To display a new recording:
1. Place your `.rrd` file in `public/data/`.
2. Update the `rrdUrl` in the component or pass it as a prop (ensuring it is converted to an absolute URL).
