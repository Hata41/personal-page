import type { APIRoute } from 'astro';
import {template} from '@/settings';

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site, url }) => {
  const base = template.base ? template.base + '/' : '';
  const baseURL = site || new URL(url).origin;
  const sitemapURL = new URL(`${base}sitemap-index.xml`, baseURL);
  return new Response(getRobotsTxt(sitemapURL));
};
