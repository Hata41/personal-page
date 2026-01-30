/**
 * RerunViewer3D Component
 * 
 * INTERFACE FOR FUTURE AGENTS:
 * This component integrates the Rerun 3D visualizer. If you need to add more Rerun viewers 
 * or modify this one, follow these CRITICAL rules to avoid common pitfalls:
 * 
 * 1. ASSETS IN PUBLIC:
 *    The Rerun WebAssembly engine (re_viewer_bg.wasm and re_viewer.js) MUST be present in 
 *    the /public folder. They are NOT automatically bundled from node_modules by Vite.
 *    If they are missing, the viewer will 404.
 * 
 * 2. USE CORE LIBRARY, NOT REACT WRAPPER:
 *    Use `import { WebViewer } from "@rerun-io/web-viewer"` directly.
 *    DO NOT use `@rerun-io/web-viewer-react` because it does not support the `base_url` 
 *    property in its props, which is required to correctly locate the WASM file.
 * 
 * 3. ABSOLUTE URLs ONLY:
 *    Always construct absolute URLs using `window.location.origin`.
 *    - BAD:  baseUrl = "/"
 *    - GOOD: baseUrl = window.location.origin + "/"
 *    Passing relative paths to `viewer.start()` will cause internal `Invalid URL` errors.
 * 
 * 4. ASTRO INTEGRATION:
 *    When using this component in an Astro page, ALWAYS use the `client:only="react"` 
 *    directive. This is mandatory because Rerun requires browser-only APIs (WebGL, 
 *    WASM, Navigation) and will crash during Static Site Generation (SSG).
 * 
 * 5. ERROR HANDLING:
 *    Always wrap `viewer.start()` in a try/catch. Common failures include:
 *    - Browser doesn't support WebGPU/WebGL.
 *    - .rrd file path is incorrect.
 *    - WASM assets are missing from public/.
 */

import React, { useState, useEffect, useRef } from "react";
import { WebViewer } from "@rerun-io/web-viewer";

export default function RerunViewer3D() {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<WebViewer | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const viewer = new WebViewer();
    viewerRef.current = viewer;

    const startViewer = async () => {
      try {
        const origin = window.location.origin;
        const rrdUrl = `${origin}/data/data.rrd`;
        const baseUrl = `${origin}/`;

        await viewer.start(rrdUrl, containerRef.current, {
          width: "100%",
          height: "100%",
          // @ts-ignore - base_url is supported in the core library
          base_url: baseUrl,
          hide_welcome_screen: true,
        });
      } catch (err: any) {
        console.error("Rerun Viewer failed to start:", err);
        setError(err?.message || "Failed to initialize the 3D viewer. This might be due to WebAssembly or WebGL issues in your browser.");
      }
    };

    startViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.stop();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "600px",
        position: "relative",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      {error && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          color: "#ff4444",
          padding: "20px",
          textAlign: "center",
          backgroundColor: "rgba(17, 17, 17, 0.9)",
          zIndex: 10
        }}>
          <h3>Failed to load 3D Viewer</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}