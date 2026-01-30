# Sebastian Reboul Academic Site - AI Agent Instructions

This document provides strict rules for AI agents (coding assistants, bots) managing this repository.

## Strict Guidelines for Commits

### 1. FILES TO COMMIT (Include in Git)
*   **Source Code:** All files in `src/` (Astro pages, MDX content, React `.tsx` components, and CSS).
*   **Structured Data:** All JSON files in `src/content/` (publications, talks, profile, etc.).
*   **Configuration:** `astro.config.mjs`, `tsconfig.json`, `package.json`, and `.gitlab-ci.yml`.
*   **Infrastructure:** `.nvmrc` and documentation like `README.md` or `plm-hosting.md`.
*   **Small Research Data:** The file `public/data/data.rrd` (currently 2.7MB) is permitted in the repo as it is essential for the 3D demo and within reasonable size limits.
*   **Rerun WASM Assets:** The files `public/re_viewer.js` and `public/re_viewer_bg.wasm`. These must stay in Git because the current CI/CD pipeline does not fetch them dynamically from `node_modules`.

### 2. FILES TO IGNORE (Never Commit)
*   **Dependencies:** `node_modules/`.
*   **Build Artifacts:** `dist/` (the production output) and `.astro/` (cache).
*   **Environment Secrets:** Any `.env` files, even if created for local testing.
*   **System Trash:** `.DS_Store`, `Thumbs.db`, and local log files (`*.log`).
*   **Large Binaries:** Any new data files exceeding **10MB**. If a file exceeds this size, alert the user and request a Git LFS setup or external hosting.

## Operational Rules

*   **Verification:** Before committing, check that the `re_viewer.js` version matches the version of `@rerun-io/web-viewer` in `package.json`.
*   **Astro Component Hydration:** Ensure any Rerun-related components in Astro pages retain the `client:only="react"` directive to prevent build-time crashes.
*   **Absolute URLs:** When updating data paths in components, always use absolute URLs (e.g., `window.location.origin + "/data/..."`) to avoid WASM initialization errors.
*   **Commit Messages:** Use descriptive, conventional commit messages (e.g., `feat: update research publications`, `fix: rerun viewer container sizing`).

## Verification Step
Before pushing any changes, run `npm run build` locally (or in the environment) to ensure the additions do not break the static site generation. If the build fails due to a missing browser API, ensure the offending component is wrapped in a `client:only` directive.
