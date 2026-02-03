import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Register the React and MDX integrations.
  site: 'https://Hata41.github.io',
  base: '/personal-page',
  integrations: [react(), mdx(), tailwind()],
});