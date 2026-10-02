import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Production domain — powers canonical URLs, the sitemap, and Open Graph tags.
  site: 'https://www.swizel.co',
  // Every page is still built to static HTML exactly as before. The
  // adapter is here so the handful of API routes under src/pages/api can
  // run as functions — nothing else on the site becomes server-rendered,
  // because only those files opt out of prerendering.
  adapter: vercel(),
  // ── short aliases for the regional pages ──
  //
  // /nigeria and /global are the real pages, because a word ranks and a
  // two-letter code does not. But people type and share the codes, and
  // /africa, /uk, /us and /eu are the obvious guesses — so they exist and
  // point at the page that answers them, with a 301 so search engines
  // credit the destination rather than treating five URLs as five pages
  // saying the same thing.
  redirects: {
    '/ng': { status: 301, destination: '/nigeria/' },
    '/africa': { status: 301, destination: '/nigeria/' },
    '/abuja': { status: 301, destination: '/nigeria/' },
    '/lagos': { status: 301, destination: '/nigeria/' },
    '/uk': { status: 301, destination: '/global/' },
    '/us': { status: 301, destination: '/global/' },
    '/eu': { status: 301, destination: '/global/' },
  },
  integrations: [
    mdx(),
    sitemap({
      // Keep utility/dump routes out of the public sitemap — and the three
      // legacy write-ups that now canonicalise to their newer case
      // studies under /work/. A page in the sitemap is a page you are
      // asking Google to index; asking it to index a URL whose own
      // canonical points elsewhere is a contradiction.
      filter: (page) =>
        !page.includes('/rss.xml') &&
        // /v/<world> are share endpoints, not pages. Each one carries
        // noindex and canonicalises to the home page, so listing them
        // here would be asking Google to index five URLs that say they
        // should not be indexed. See src/pages/v/[view].astro.
        !/\/v\/[^/]+\/?$/.test(page) &&
        !/\/portfolio\/(betslipswitch|brixmarketplace|hemamsynergy)\/?$/.test(page),
      // Not every page deserves the same attention from a crawler. The
      // pages that earn money get a higher priority and a faster
      // changefreq than the 404; the blog index moves often and the
      // service pages barely move at all. Google treats these as hints
      // rather than instructions, but a sitemap that says everything is
      // equally important is a sitemap that says nothing.
      serialize(item) {
        const path = new URL(item.url).pathname;
        const is = (p) => path === p || path === `${p}/`;

        if (is('/')) {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (
          is('/services') ||
          is('/contact') ||
          path.startsWith('/services/') ||
          is('/nigeria') ||
          is('/global')
        ) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (is('/portfolio') || is('/about') || is('/blog')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/blog/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (path.startsWith('/portfolio/') || path.startsWith('/work/')) {
          item.priority = 0.7;
          item.changefreq = 'yearly';
        } else if (is('/404')) {
          return undefined; // a 404 has no business in a sitemap
        } else {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
    tailwind(),
    // Local SVGs live in src/icons/*; the `mdi` set is bundled offline via
    // @iconify-json/mdi, so icons never depend on a remote API at build time.
    icon({ iconDir: 'src/icons' }),
  ],
});
