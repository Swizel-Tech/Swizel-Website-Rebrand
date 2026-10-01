// The moment after somebody presses send.
//
// A toast in the corner is what the site used to give for this, and a
// toast is the wrong weight: writing a brief takes a few minutes and
// deserves more than a strip of text that slides away before it is read.
//
// The campus world already had the right answer — a card that holds the
// screen, says what happens next, and then offers somewhere to GO. That
// last part is the bit that matters. Somebody who has just written to you
// is the most interested they will ever be; handing them one link and a
// Close button wastes the only moment in the visit where they will read
// anything you suggest. This is that card, for every world, taking each
// one's accent so it never looks borrowed.
export interface SentOption {
	/** A single character. An emoji reads at any size and needs no asset. */
	icon: string;
	title: string;
	desc: string;
	href: string;
	/** for the magazine, which is a file rather than a page */
	download?: boolean;
}

export interface SentOpts {
	title: string;
	body: string;
	/** the address we just wrote to, shown so they know to look for it */
	echo?: string;
	/** the one thing we would most like them to do next */
	cta?: { label: string; href: string };
	/** and the rest, as a list. Omit for the house set. */
	options?: SentOption[];
}

/**
 * Where to send somebody who has just written to us. The same four the
 * campus sheet offers, because they were the right four: proof, thinking,
 * something to keep, and the thing that makes this site unusual.
 */
const HOUSE: SentOption[] = [
	{
		icon: '🏆',
		title: 'See what we have shipped',
		desc: 'Sixty-five builds, the full write-ups, and the numbers behind them.',
		href: '/portfolio',
	},
	{
		icon: '📰',
		title: 'Read the journal',
		desc: 'How we think about building for this market, in plain language.',
		href: '/blog',
	},
	{
		icon: '📖',
		title: 'Take The Brevarium',
		desc: 'Our magazine, free: featured projects, the team, and the thinking.',
		href: '/brevarium/the-brevarium-latest.pdf',
		download: true,
	},
	{
		icon: '🎛️',
		title: 'Try another world',
		desc: 'The same Swizel in five skins. Pick the one that talks like you do.',
		href: '/?views=1',
	},
];

let host: HTMLElement | null = null;

function build(): HTMLElement {
	const el = document.createElement('div');
	el.className = 'sent';
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');
	el.hidden = true;
	el.innerHTML = `
		<div class="sent__veil" data-sent-close></div>
		<div class="sent__card" role="document">
			<button type="button" class="sent__x" data-sent-close aria-label="Close">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
					stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
			<span class="sent__ring" aria-hidden="true">
				<svg viewBox="0 0 52 52" width="52" height="52" fill="none" aria-hidden="true">
					<circle class="sent__ring-o" cx="26" cy="26" r="24" stroke="currentColor" stroke-width="2" />
					<path class="sent__tick" d="M15 27l8 8 15-16" stroke="currentColor" stroke-width="3"
						stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
			<h2 class="sent__h" data-sent-title></h2>
			<p class="sent__p" data-sent-body></p>
			<p class="sent__echo" data-sent-echo hidden></p>
			<div class="sent__links" data-sent-links></div>
			<div class="sent__acts">
				<a class="sent__go" data-sent-cta hidden></a>
				<button type="button" class="sent__close" data-sent-close>Close</button>
			</div>
		</div>`;
	document.body.appendChild(el);
	return el;
}

export function showSent(opts: SentOpts) {
	if (!host) host = build();
	const q = <T extends HTMLElement>(s: string) => host!.querySelector<T>(s)!;

	q('[data-sent-title]').textContent = opts.title;
	q('[data-sent-body]').textContent = opts.body;

	const echo = q<HTMLElement>('[data-sent-echo]');
	if (opts.echo) {
		echo.textContent = `Check your inbox at ${opts.echo}. We just sent you a confirmation.`;
		echo.hidden = false;
	} else echo.hidden = true;

	// ── the onward links ──
	const links = q<HTMLElement>('[data-sent-links]');
	const list = opts.options ?? HOUSE;
	links.innerHTML = list
		.map(
			(o) => `
			<a class="sent__link" href="${o.href}"${o.download ? ' download' : ''}>
				<span class="sent__link-ic" aria-hidden="true">${o.icon}</span>
				<span class="sent__link-t">
					<strong>${o.title}</strong>
					<em>${o.desc}</em>
				</span>
				<svg class="sent__link-go" viewBox="0 0 24 24" width="15" height="15" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
					aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
			</a>`
		)
		.join('');

	const cta = q<HTMLAnchorElement>('[data-sent-cta]');
	if (opts.cta) {
		cta.textContent = opts.cta.label;
		cta.href = opts.cta.href;
		cta.hidden = false;
	} else cta.hidden = true;

	host.hidden = false;
	// a frame, so the opening transition has a state to move from
	requestAnimationFrame(() => host!.classList.add('is-on'));
	document.documentElement.style.overflow = 'hidden';
	q<HTMLButtonElement>('.sent__x').focus();

	const close = () => {
		host!.classList.remove('is-on');
		document.documentElement.style.overflow = '';
		window.setTimeout(() => (host!.hidden = true), 260);
		document.removeEventListener('keydown', onKey);
	};
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') close();
	};

	host.querySelectorAll('[data-sent-close]').forEach((b) =>
		b.addEventListener('click', close, { once: true })
	);
	document.addEventListener('keydown', onKey);

	// Any link in the card navigates with swup, which swaps the page
	// without reloading it — so the card survived the trip and sat on top
	// of the page it had just sent you to. It closes itself on the way
	// out, and again if anything else navigates while it is open.
	host.querySelectorAll('.sent__link, .sent__go').forEach((a) =>
		a.addEventListener('click', close, { once: true })
	);
	const swup = (window as unknown as { swup?: { on?: (e: string, f: () => void) => void } }).swup;
	swup?.on?.('contentReplaced', close);
}
