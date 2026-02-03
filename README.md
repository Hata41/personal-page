# Personal Doctorate Website – Astro + React

This repository contains a skeleton of a personal academic website built with [Astro](https://astro.build/) and React. It is designed for researchers who wish to host their site on **GitHub Pages**. The site uses Astro’s static site generator capabilities while allowing React components to be sprinkled into Markdown/MDX.

## Purpose

- Provide a simple, maintainable starting point for a personal site (CV, publications, talks, blog, etc.).
- Use Markdown/MDX for content while keeping the site static and easy to host.
- Include React components only where interactivity is needed, without requiring a Node.js backend.
- Generate static assets that can be deployed on GitHub Pages using GitHub Actions.

## Repository structure

```
personal-page/
│
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript compiler configuration (extends Astro’s base config)
├── astro.config.mjs    # Astro configuration enabling React and MDX
├── .github/workflows/deploy.yml # GitHub Actions workflow to build and publish the site
├── README.md           # Overview of the project (this file)
├── .gitignore          # Files and folders ignored by Git
│
├── public/             # Static assets (copied directly to the final site)
│
├── src/
│   ├── content/        # Structured data files (JSON) for publications, talks, etc.
│   │   ├── config.ts   # Content collections configuration
│   │   ├── profile/    # Profile information
│   │   ├── publications/ # Publications data
│   │   ├── talks/      # Talks data
│   │   └── teaching/   # Teaching data
│   │
│   ├── layouts/        # Astro layouts for consistent structure
│   │   └── BaseLayout.astro # Main layout with navbar and footer
│   │
│   ├── pages/          # Website pages (Astro, Markdown, MDX)
│   │   ├── index.astro # Home page
│   │   ├── research.mdx # Research overview
│   │   ├── publications.astro # Publications with filter
│   │   ├── talks.astro # Talks list
│   │   ├── teaching.astro # Teaching list
│   │   ├── cv.mdx      # CV page
│   │   ├── contact.astro # Contact info
│   │   ├── legal.mdx   # Legal notice
│   │   └── about.mdx   # About page (example)
│   │
│   └── components/     # React components (TypeScript)
│       ├── Counter.tsx # Example counter
│       ├── CopyEmailButton.tsx # Copy email to clipboard
│       └── PublicationFilter.tsx # Filter publications
│
└── dist/               # Generated output after running `npm run build` (ignored)
```

## Usage

1. **Install dependencies**

   ```bash
   npm install
   ```

   This downloads the packages listed in `package.json` (Astro, React, etc.) into the `node_modules` folder (which is ignored from version control).

2. **Develop locally**

   ```bash
   npm run dev
   ```

   This starts a local development server on <http://localhost:4321> (the port may vary).  You can edit files in `src/pages` and `src/components` and see changes live.

3. **Build for production**

   ```bash
   npm run build
   ```

   The built static site will be output to the `dist/` directory.  The `dist` folder contains plain HTML, CSS and JavaScript files ready to be served by a static web server.

## Deploy to GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

1. **Push to GitHub**: Commit your changes and push them to the `main` branch of your GitHub repository.
2. **Enable GitHub Actions**: 
   - Go to your repository on GitHub.
   - Navigate to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
3. **Automatic Deployment**: The workflow in `.github/workflows/deploy.yml` will trigger on every push to `main`, building the site and deploying it to `https://Hata41.github.io/personal-page/`.

## Editing Content

### Structured Data

The site uses JSON files in `src/content/` for structured data that can be easily edited:

- `src/content/profile/profile.json`: Personal information, bio, links, etc.
- `src/content/publications/publications.json`: List of publications.
- `src/content/talks/talks.json`: List of talks.
- `src/content/teaching/teaching.json`: List of teaching activities.

Edit these JSON files to update your information. The schema is defined in `src/content/config.ts`.

### Pages

- Static pages are in `src/pages/` as `.astro` or `.mdx` files.
- Use MDX for pages that need Markdown formatting.
- React components can be embedded in MDX with `client:load`.

### Styling

Global styles are in `src/styles/global.css`. Edit this file for site-wide styling.

- This repository intentionally does not include the `node_modules` directory.  Dependencies are resolved via `npm install`.
- The example pages are intentionally simple.  Feel free to add additional `.astro`, `.md`, or `.mdx` pages, new React components in `src/components`, and static assets in `public/`.
- If you plan to embed React inside Markdown, ensure that you are using MDX (`.mdx` files) and see `astro.config.mjs` for the MDX integration.

## TypeScript usage

This project is configured to use **TypeScript**.  All React components are written as `.tsx` files and the project includes a `tsconfig.json` that extends Astro’s base configuration.  You can write TypeScript in your components and pages to benefit from static type checking and editor autocompletion.  The compiler options in `tsconfig.json` enable strict type checking and set up JSX to work with React.  If you prefer a more relaxed configuration, adjust the options accordingly.

Enjoy building your personal academic site! If you are an LLM agent charged with editing this repository, please refer to the project structure and Astro documentation for guidance.
