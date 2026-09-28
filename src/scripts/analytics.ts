// Google Analytics 4, loaded late and taught about swup.
//
// Two things the snippet Google hands you gets wrong on this site.
//
// First, it is `async` in the <head>, so it competes with the fonts and
// the first images for the connection on the very request where the
// first screen is being assembled. It is loaded here on idle instead —
// or on the visitor's first real move, whichever comes first — so it
// costs nothing on the metrics anyone measures the site by.
//
// Second, the site navigates with swup: the URL changes and the markup
// is swapped, but the page never reloads, so gtag's automatic page_view
// fires exactly once — on the first page — and every page after it is
// invisible. The view is sent by hand on each swap.
import { GA_ID, GA_LEGACY_ID, ADS_ID } from '../consts';

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		__swzGaReady?: boolean;
	}
}

/** The measurement ID, unless an environment variable overrides it. */
const ID = (import.meta.env.PUBLIC_GA_ID as string | undefined)?.trim() || GA_ID;

/**
 * Everything this page reports to. The GA4 property for swizel.co, the
 * property the old site used (kept so its history stays continuous), and
 * the Google Ads tag for conversions. Empty entries drop out.
 */
const TAGS = [ID, GA_LEGACY_ID, ADS_ID].filter(Boolean) as string[];

let loading = false;

function load() {
	if (loading || window.__swzGaReady || !TAGS.length) return;
	loading = true;

	window.dataLayer = window.dataLayer || [];
	window.gtag = function gtag() {
		// eslint-disable-next-line prefer-rest-params
		window.dataLayer!.push(arguments);
	};
	window.gtag('js', new Date());
	// send_page_view is off for the analytics properties because swup means
	// we send them by hand; the Ads tag keeps its own default, since it
	// counts conversions rather than pages.
	TAGS.forEach((tag) => {
		if (tag.startsWith('AW-')) window.gtag!('config', tag);
		else window.gtag!('config', tag, { send_page_view: false });
	});

	// one script serves every tag on the account
	const s = document.createElement('script');
	s.async = true;
	s.src = `https://www.googletagmanager.com/gtag/js?id=${TAGS[0]}`;
	document.head.appendChild(s);

	window.__swzGaReady = true;
	page(); // the page they actually arrived on
}

/** One page view, with the title and path as they are right now. */
export function page() {
	if (!window.gtag) return;
	TAGS.filter((t) => t.startsWith('G-')).forEach((tag) => {
		window.gtag!('event', 'page_view', {
			send_to: tag,
			page_title: document.title,
			page_location: window.location.href,
			page_path: window.location.pathname + window.location.search,
		});
	});
}

/** Anything worth counting: a form sent, a world chosen, a film opened. */
export function track(name: string, params: Record<string, unknown> = {}) {
	if (!window.gtag) return;
	window.gtag('event', name, params);
}

export function initAnalytics() {
	if (!TAGS.length) return; // nothing configured: the site carries no tag

	// Honour the browser's own "do not track". It is not a legal
	// requirement in most places, but it is a clear request.
	if (navigator.doNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1') {
		return;
	}

	if (window.__swzGaReady) {
		page(); // a swup navigation on an already-loaded tag
		return;
	}

	// whichever comes first: the browser going quiet, the visitor moving,
	// or three seconds. The listeners are all `once`, so nothing lingers.
	const go = () => load();
	const idle = (window as { requestIdleCallback?: (cb: () => void, o?: object) => number })
		.requestIdleCallback;
	if (idle) idle(go, { timeout: 3000 });
	else window.setTimeout(go, 1800);

	['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((ev) =>
		window.addEventListener(ev, go, { once: true, passive: true })
	);
}
