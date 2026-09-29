import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Production domain — powers canonical URLs, the sitemap, and Open Graph tags.
  site: 'https://swizel.co',
  // Every page is still built to static HTML exactly as before. The
  // adapter is here so the handful of API routes under src/pages/api can
  // run as functions — nothing else on the site becomes server-rendered,
  // because only those files opt out of prerendering.
  adapter: vercel(),
  integrations: [
    mdx(),
    sitemap({
      // Keep utility/dump routes out of the public sitemap.
      filter: (page) => !page.includes('/rss.xml'),
    }),
    tailwind(),
    // Local SVGs live in src/icons/*; the `mdi` set is bundled offline via
    // @iconify-json/mdi, so icons never depend on a remote API at build time.
    icon({ iconDir: 'src/icons' }),
  ],
});
