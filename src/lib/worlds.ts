// ─────────────────────────────────────────────────────────────────────────
// The five worlds, and which pages have a version of each.
//
// Every page used to carry all five worlds in its HTML and hide four of
// them with CSS. A visitor in Boardroom downloaded Builder, Founder,
// Campus and Studio on every page — five times the markup, five times the
// DOM, and five contradictory tellings of one page for a search engine.
//
// Now each world is its own prerendered page:
//
//   /about               Boardroom — the default, the one search engines see
//   /v/founder/about     Founder
//   /v/builder/about     Builder, and so on
//
// The address bar still says /about for everybody: the edge middleware at
// /middleware.ts reads the swizel-view cookie and rewrites the request to
// the right file. If that middleware is ever missing (local dev, another
// host), the inline script in BaseHead notices the page was built for a
// different world than the visitor chose and sends them to the /v/ URL
// instead. Either way the visitor sees their world; only the address bar
// differs.
//
// This file is shared by the build, the browser and the edge, so it must
// stay plain TypeScript — no Astro, no DOM, no node.
// ─────────────────────────────────────────────────────────────────────────

export const WORLDS = ['boardroom', 'builder', 'founder', 'campus', 'studio'] as const;
export type World = (typeof WORLDS)[number];

/** The world a page is built in when nobody has chosen one. */
export const DEFAULT_WORLD: World = 'boardroom';

export const isWorld = (v: unknown): v is World =>
	typeof v === 'string' && (WORLDS as readonly string[]).includes(v);

/** The cookie the edge reads. Same name as the localStorage key. */
export const WORLD_COOKIE = 'swizel-view';

/**
 * Pages that exist in all five worlds. Everything else — Programs, the
 * regional landing pages, blog posts, the 404 — is one page skinned by
 * CSS, and must never be rewritten to a /v/ path that does not exist.
 *
 * Keep this in step with src/pages/v/<world>/.
 */
const VARIANT_PATHS = [
	/^\/$/,
	/^\/about\/?$/,
	/^\/services\/?$/,
	/^\/services\/(?!app-development|custom-software|erp-systems)[^/]+\/?$/,
	/^\/portfolio\/?$/,
	/^\/work\/[^/]+\/?$/,
	/^\/blog\/?$/,
	/^\/contact\/?$/,
];

export const hasWorldVariant = (pathname: string): boolean =>
	VARIANT_PATHS.some((re) => re.test(pathname));

const PREFIX = /^\/v\/(boardroom|builder|founder|campus|studio)(?=\/|$)/;

/** `/v/founder/about/` → `/about/`; `/v/founder` → `/`. */
export const stripWorld = (pathname: string): string => pathname.replace(PREFIX, '') || '/';

/** The world a /v/ path names, or null for a clean path. */
export const worldInPath = (pathname: string): World | null => {
	const m = PREFIX.exec(pathname);
	return m ? (m[1] as World) : null;
};

/**
 * The URL that serves `pathname` in `world` with no help from the edge.
 * Boardroom is the clean path itself; the others live under /v/.
 */
export const worldHref = (pathname: string, world: World): string => {
	const clean = stripWorld(pathname);
	if (world === DEFAULT_WORLD || !hasWorldVariant(clean)) return clean;
	return `/v/${world}${clean === '/' ? '/' : clean}`;
};
