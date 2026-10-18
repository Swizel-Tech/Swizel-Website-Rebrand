// Switching worlds — the part of the view experience that every page
// needs (the rail, the nav, the quiz), kept apart from the quiz itself so
// it stays small. See viewStore.ts for where the choice is kept and
// src/lib/worlds.ts for the shape of the URLs.
import { armViewNudge } from './viewNudge';
import { isWorld } from '../lib/worlds';
import { rememberWorld, worldPageUrl, pageHasWorlds } from './viewStore';

/**
 * Walk into a world.
 *
 * On a page that exists in every world (home, About, Services…) the
 * markup for the chosen world is a separate prerendered page, so the
 * switch is a swup navigation to it — behind the same curtain as any
 * other page move, with the address bar put back to the clean path once
 * it lands. On a page that is one markup skinned by CSS (Programs, a
 * blog post) the attribute flips in place, exactly as before.
 *
 * Theme (light/dark) is independent and untouched.
 */
export function applyView(id: string) {
	if (!isWorld(id)) return;
	const root = document.documentElement;
	const before = root.getAttribute('data-view');
	rememberWorld(id);
	try {
		// Choosing a world by hand makes "the world you came from" stale:
		// Programs would otherwise still offer a door back to somewhere you
		// left ages ago. See scripts/programsNotice.ts.
		sessionStorage.removeItem('swizel-came-from');
	} catch (e) {}
	// The site is about to look completely different. Point at the control
	// that undoes it, once, on whatever page they land on. See viewNudge.ts.
	armViewNudge();

	const builtFor = root.getAttribute('data-world');
	const swup = (window as any).swup;
	if (builtFor && builtFor !== id && swup && pageHasWorlds(location.pathname)) {
		// a different file holds this page in that world — go and get it.
		// Its stylesheets are asked for right now, in parallel with the
		// HTML, so the transition's 3 s wait for them is never reached.
		warmWorldStyles(id);
		// The cache is emptied first: it is keyed by address, and a clean
		// address means "whatever world the cookie said at the time".
		try { swup.cache.empty(); } catch (e) {}
		(window as any).__swzWorldSwitch = true;
		swup.loadPage({ url: worldPageUrl(location.pathname, id, true), history: 'replace' });
		return;
	}

	root.setAttribute('data-view', id);
	if (before === id) return;
	// Switching worlds should always land you at the top, so the new view is
	// seen from its hero rather than wherever you happened to be scrolled.
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
	window.dispatchEvent(new CustomEvent('swizel:viewchange', { detail: id }));
}

/**
 * Warm the cache for a world the visitor is about to choose. Called on
 * hover, focus and touch of anything that switches worlds, so the page
 * is usually already here by the time the click lands.
 */
export function prefetchWorld(id: string) {
	if (!isWorld(id)) return;
	const swup = (window as any).swup;
	if (!swup || !pageHasWorlds(location.pathname)) return;
	if (id === (document.documentElement.getAttribute('data-world') || '')) return;
	const url = worldPageUrl(location.pathname, id, true);
	warmWorldStyles(id);
	try {
		if (swup.cache.exists(url)) return;
		swup
			.fetchPage({ url })
			.then((page: { originalContent?: string }) => preloadStyles(page?.originalContent || ''))
			.catch(() => {});
	} catch (e) {}
}

/**
 * A world's page brings its own stylesheets. Fetching the HTML ahead of
 * the click is only half the job — the styles are what the visitor
 * would otherwise wait for behind the curtain. Each one the current page
 * does not already have is asked for now, as a preload, so it is in the
 * cache by the time the page is swapped in.
 */
const preloaded = new Set<string>();

/**
 * The build writes onto <main id="swup"> which stylesheets each sibling
 * world needs that this page does not have (scripts/world-css-manifest).
 * This asks for them. No manifest (local dev) means nothing to do here;
 * preloadStyles below still covers it once the HTML has been fetched.
 */
export function warmWorldStyles(id: string, attr: 'data-world-css' | 'data-home-css' = 'data-world-css') {
	try {
		const raw = document.getElementById('swup')?.getAttribute(attr);
		if (!raw) return;
		const map = JSON.parse(raw) as Record<string, string[]>;
		(map[id] || []).forEach(preloadOne);
	} catch (e) {}
}

function preloadOne(href: string) {
	const abs = new URL(href, location.origin).href;
	if (preloaded.has(abs)) return;
	if (Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).some((l) => l.href === abs)) return;
	preloaded.add(abs);
	const l = document.createElement('link');
	l.rel = 'preload';
	l.as = 'style';
	l.href = abs;
	document.head.appendChild(l);
}

function preloadStyles(html: string) {
	if (!html) return;
	const re = /<link\s+rel="stylesheet"\s+href="([^"]+)"/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) preloadOne(m[1]!);
}

