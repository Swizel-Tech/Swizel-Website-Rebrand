import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Production domain — powers canonical URLs, the sitemap, and Open Graph tags.
  site: 'https://swizel.co',
  integrations: [
    mdx(),
    sitemap({
      // Keep utility/dump routes out of the public sitemap.
      filter: (page) => !page.includes('/rss.xml'),
    }),
    tailwind(),
  ],
});
