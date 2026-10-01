// Sharing a page, in the world you were reading it in.
//
// The problem this solves: somebody reading the portfolio in Builder
// wants to send it to a friend. Copying the address bar sends
// /portfolio, and the friend opens it in whatever world THEY last chose
// — which for a first-time visitor is none at all. The thing that made
// it worth sending does not survive the sending.
//
// So the link carries ?view=<world>, which BaseHead reads before the
// first paint. See the long note there for why it is read that early and
// why it counts as onboarded.
//
// Anything with [data-share] opens the share sheet on a phone and copies
// the link on a desktop, which is what each platform actually has.

/**
 * The current page, with the world the reader is in attached.
 *
 * Two shapes, because a preview card and a person need different things.
 *
 * Sharing the HOME page in a world gives /v/<world>. That is a real
 * prerendered path with its own og:image and og:title, so WhatsApp,
 * LinkedIn, Slack and X build a card that actually shows which world is
 * being sent. A query string could never do that: it does not change which
 * file a static host serves, and none of those crawlers runs the JavaScript
 * that would fix it afterwards — so every link, from every world, produced
 * one identical card. /v/<world> redirects a person straight on to
 * /?view=<world>, which is the URL that has always worked for humans.
 *
 * Sharing any OTHER page keeps ?view=, because the right card for
 * /portfolio is Portfolio's own. The world still travels with the link; it
 * is only the picture that stays the page's.
 */
export function shareUrl(): string {
	const url = new URL(window.location.href);
	const view = document.documentElement.getAttribute('data-view');

	// No attribute means the visitor has not chosen a world, so there is
	// nothing to carry — and a bare link is the honest thing to send.
	if (!view) {
		url.searchParams.delete('view');
		return url.toString();
	}

	const onHome = url.pathname === '/' || url.pathname === '/index.html';
	if (onHome) {
		url.pathname = `/v/${view}`;
		url.searchParams.delete('view');
		url.hash = '';
		return url.toString();
	}

	url.searchParams.set('view', view);
	return url.toString();
}

/** Say what happened, on the button itself, then put it back. */
function flash(btn: HTMLElement, text: string) {
	const label = btn.querySelector<HTMLElement>('[data-share-label]') ?? btn;
	const was = label.textContent;
	label.textContent = text;
	btn.setAttribute('data-shared', '');
	window.setTimeout(() => {
		label.textContent = was;
		btn.removeAttribute('data-shared');
	}, 2200);
}

export function initShare() {
	if ((window as { __shareBound?: boolean }).__shareBound) return;
	(window as { __shareBound?: boolean }).__shareBound = true;

	document.addEventListener('click', async (e) => {
		const btn = (e.target as HTMLElement)?.closest?.<HTMLElement>('[data-share]');
		if (!btn) return;
		e.preventDefault();

		const url = shareUrl();
		const title = document.title;

		// The share sheet, where there is one. navigator.share needs a user
		// gesture and HTTPS, and throws AbortError if the sheet is
		// dismissed — which is not a failure and must not fall through to
		// copying something the person decided not to send.
		if (navigator.share) {
			try {
				await navigator.share({ title, url });
				return;
			} catch (err) {
				if ((err as Error)?.name === 'AbortError') return;
				// anything else: fall through and copy instead
			}
		}

		try {
			await navigator.clipboard.writeText(url);
			flash(btn, 'Link copied');
		} catch {
			// clipboard refused — usually an insecure origin. Put the URL
			// somewhere it can be copied by hand rather than failing mutely.
			window.prompt('Copy this link', url);
		}
	});
}
