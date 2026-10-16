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
	try {
		if (swup.cache.exists(url)) return;
		swup.fetchPage({ url }).catch(() => {});
	} catch (e) {}
}

