// Where the chosen world lives in the browser, and how a page in another
// world is reached. See src/lib/worlds.ts for the shape of the URLs.
import {
	DEFAULT_WORLD,
	WORLD_COOKIE,
	hasWorldVariant,
	isWorld,
	stripWorld,
	worldHref,
	type World,
} from '../lib/worlds';

const VIEW_KEY = 'swizel-view';
const ONBOARDED_KEY = 'swizel-onboarded';
const NOEDGE_KEY = 'swizel-noedge';

/** The world the visitor chose, or the default. */
export function storedWorld(): World {
	try {
		const v = localStorage.getItem(VIEW_KEY);
		if (isWorld(v)) return v;
	} catch (e) {}
	const attr = document.documentElement.getAttribute('data-view');
	return isWorld(attr) ? attr : DEFAULT_WORLD;
}

/**
 * Remember a world everywhere it needs remembering: localStorage for the
 * page, a cookie for the edge, and "onboarded" so the quiz stays shut.
 */
export function rememberWorld(id: World, onboard = true) {
	try {
		localStorage.setItem(VIEW_KEY, id);
		if (onboard) localStorage.setItem(ONBOARDED_KEY, '1');
	} catch (e) {}
	try {
		document.cookie = `${WORLD_COOKIE}=${id};path=/;max-age=31536000;SameSite=Lax`;
	} catch (e) {}
}

/**
 * Is the edge rewriting clean addresses to the visitor's world? Assumed
 * yes in production until a page arrives in the wrong world (BaseHead
 * sets the flag), and never on localhost.
 */
export function edgeServesWorlds(): boolean {
	const h = location.hostname;
	if (h === 'localhost' || h === '127.0.0.1') return false;
	try {
		return sessionStorage.getItem(NOEDGE_KEY) !== '1';
	} catch (e) {
		return true;
	}
}

/**
 * The address to load for `pathname` in `world`.
 *
 * Switching worlds always goes through the explicit /v/ address, even
 * when the edge is there: it is unambiguous, so swup's cache can never
 * hand back the page in the wrong world, and the address bar is put
 * right afterwards (see MainLayout). Ordinary links use the clean path
 * and let the edge choose — unless the edge is known to be away.
 */
export function worldPageUrl(pathname: string, world: World, explicit = false): string {
	if (explicit || !edgeServesWorlds()) return worldHref(pathname, world);
	return stripWorld(pathname);
}

/** Does the page at this path exist in every world? */
export const pageHasWorlds = (pathname: string) => hasWorldVariant(stripWorld(pathname));
