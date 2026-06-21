import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

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
    // Local SVGs live in src/icons/*; the `mdi` set is bundled offline via
    // @iconify-json/mdi, so icons never depend on a remote API at build time.
    icon({ iconDir: 'src/icons' }),
  ],
});
