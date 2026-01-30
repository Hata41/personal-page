// Astro configuration file enabling React and MDX integrations.
// See https://docs.astro.build for full configuration options.

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({  site: 'https://your-site.pages.math.cnrs.fr',  // Register the React and MDX integrations.  MDX allows you to write
  // pages in `.mdx` format and embed React components directly in
  // Markdown content.  The React integration enables client‑side
  // hydration of React components in Astro pages.
  integrations: [react(), mdx()],

  // You can set additional config options here (e.g. site, build options).
  // For a personal site, default settings are often sufficient.
});
