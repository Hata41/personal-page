// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

import { template } from "./src/settings";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    integrations: [react(), tailwind(), sitemap()],
    site: import.meta.env.PROD ? 'https://Hata41.github.io' : undefined,
    base: import.meta.env.PROD ? '/personal-page' : '',
});
