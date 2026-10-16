// ─────────────────────────────────────────────────────────────────────────
// Vercel Edge Middleware — serves each visitor the world they chose, at
// the clean address.
//
// Every page that exists in all five worlds is prerendered five times:
// /about is Boardroom, /v/founder/about is Founder, and so on (see
// src/lib/worlds.ts). This runs at the edge before any file is served:
// it reads the swizel-view cookie the site sets when a world is chosen,
// and REWRITES — not redirects — the request to that world's file. The
// address bar still says /about; the bytes are Founder's.
//
// It is Vercel's own middleware, not Astro's, because Astro middleware
// never runs for prerendered pages at request time. It must not import
// anything from `astro:*`. Nothing here is ever needed for the site to
// work: if it is missing, the inline script in BaseHead notices a page
// arrived in the wrong world and loads the /v/ address instead. This is
// the faster path, not the only one.
// ─────────────────────────────────────────────────────────────────────────
import { next, rewrite } from '@vercel/edge';
import { DEFAULT_WORLD, WORLD_COOKIE, hasWorldVariant, isWorld, worldHref } from './src/lib/worlds';

export const config = {
	// Not the API, not Astro's hashed assets, not the /v/ pages themselves.
	// Everything else is checked against the list of pages that exist per
	// world (hasWorldVariant) — a stylesheet or an image never matches it.
	matcher: ['/((?!api/|_astro/|v/).*)'],
};

export default function middleware(request: Request) {
	const url = new URL(request.url);
	const path = url.pathname;
	if (!hasWorldVariant(path)) return next();

	// a shared link names its world outright; the cookie says what the
	// visitor chose last time
	let world = url.searchParams.get('view');
	if (!isWorld(world)) {
		const m = new RegExp(`(?:^|;\\s*)${WORLD_COOKIE}=([a-z]+)`).exec(request.headers.get('cookie') || '');
		world = m ? m[1]! : null;
	}
	if (!isWorld(world) || world === DEFAULT_WORLD) return next();

	url.pathname = worldHref(path, world);
	return rewrite(url);
}
