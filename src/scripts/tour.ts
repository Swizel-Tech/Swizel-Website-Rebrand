// The guided tour: a spotlight, a caption card, and a pointer that travels
// between stops like a teacher walking a class through the room.
//
// Two doors are offered before it starts. "Just this page" walks the page
// you are standing on. "The full tour" carries on across the site, one leg
// per page, remembering where it got to.
export type TourStep = { sel: string; title: string; body: string };
export type TourLeg = { path: string; label: string; steps: TourStep[] };

const KEY = 'swizel-tour';

/** The tour walks five different worlds, and it used to narrate all of
 *  them as a school — "the campus", "the whole school", instructors and
 *  service years — which reads as a mistake in the gallery, the workshop
 *  or the boardroom. Each world names its own first leg and its own last
 *  word; everything between is written so it is true in all five. */
type Lex = { home: string; endK: string; endH: string };
const LEX: Record<string, Lex> = {
	campus: { home: 'The campus', endK: 'That is the whole campus', endH: 'Thanks for walking round with us.' },
	studio: { home: 'The gallery', endK: 'That is the whole collection', endH: 'Thanks for walking the rooms with us.' },
	builder: { home: 'The workshop', endK: 'That is the whole workshop', endH: 'Thanks for looking round the build.' },
	founder: { home: 'The desk', endK: 'That is the whole story', endH: 'Thanks for hearing us out.' },
	boardroom: { home: 'The floor', endK: 'That is the whole floor', endH: 'Thanks for your time.' },
};
const lex = (): Lex =>
	LEX[document.documentElement.getAttribute('data-view') || 'boardroom'] ?? LEX.boardroom!;

/** The first match that is actually on the screen. Every world's markup
 *  lives in the page at once and only one is displayed, so the first hit in
 *  DOM order is often a hidden one. */
const pick = (sel: string): HTMLElement | null => {
	for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
		const r = el.getBoundingClientRect();
		if (r.width > 4 && r.height > 4) return el;
	}
	return null;
};

type Saved = { legs: TourLeg[]; i: number };

const read = (): Saved | null => {
	try {
		const raw = sessionStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as Saved) : null;
	} catch {
		return null;
	}
};
const write = (s: Saved | null) => {
	try {
		if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
		else sessionStorage.removeItem(KEY);
	} catch {}
};

/** Walk a set of stops on the page you are on. */
export function startTour(
	steps: TourStep[],
	opts: { onDone?: () => void; legLabel?: string; legOf?: string } = {}
) {
	const live = steps.filter((s) => !!pick(s.sel));
	if (!live.length) {
		opts.onDone?.();
		return;
	}
	document.querySelector('.tour-overlay')?.remove();

	let idx = 0;
	const overlay = document.createElement('div');
	overlay.className = 'tour-overlay';
	overlay.innerHTML =
		'<div class="tour-hole"></div>' +
		'<div class="tour-hand" aria-hidden="true"><span class="tour-hand-stick"></span><span class="tour-hand-tip"></span></div>' +
		'<div class="tour-pop" role="dialog" aria-live="polite"></div>';
	const hole = overlay.querySelector<HTMLElement>('.tour-hole')!;
	const hand = overlay.querySelector<HTMLElement>('.tour-hand')!;
	const pop = overlay.querySelector<HTMLElement>('.tour-pop')!;
	document.body.appendChild(overlay);
	document.documentElement.classList.add('tour-open');
	document.body.style.overflow = 'hidden';

	let finished = false;
	const end = (done = false) => {
		overlay.remove();
		document.documentElement.classList.remove('tour-open');
		document.body.style.overflow = '';
		window.removeEventListener('keydown', key);
		window.removeEventListener('resize', place);
		overlay.removeEventListener('click', away);
		if (done && !finished) {
			finished = true;
			opts.onDone?.();
		} else if (!done) {
			write(null);
		}
	};
	const key = (e: KeyboardEvent) => {
		if (e.key === 'Escape') end();
		else if (e.key === 'ArrowRight') go(idx + 1);
		else if (e.key === 'ArrowLeft') go(idx - 1);
	};
	window.addEventListener('keydown', key);

	// Clicking off the card ends the tour. The overlay covers the screen,
	// so anything that is not the card itself — the dimmed page, the lit
	// element, the pointer — counts as "outside".
	const away = (e: MouseEvent) => {
		const t = e.target as HTMLElement | null;
		if (t && t.closest('.tour-pop')) return;
		e.preventDefault();
		end();
	};
	overlay.addEventListener('click', away);

	const place = () => {
		const s = live[idx]!;
		const el = pick(s.sel);
		if (!el) return;
		const r = el.getBoundingClientRect();
		const pad = 8;
		hole.style.left = r.left - pad + 'px';
		hole.style.top = r.top - pad + 'px';
		hole.style.width = r.width + pad * 2 + 'px';
		hole.style.height = r.height + pad * 2 + 'px';

		const pw = pop.offsetWidth;
		const ph = pop.offsetHeight;
		let top = r.bottom + 18;
		if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 18);
		let left = r.left;
		if (left + pw > window.innerWidth - 12) left = window.innerWidth - 12 - pw;
		if (left < 12) left = 12;
		pop.style.top = top + 'px';
		pop.style.left = left + 'px';

		// the pointer reaches in from whichever side has room
		const fromLeft = r.left > 150;
		hand.classList.toggle('is-right', !fromLeft);
		hand.style.left = (fromLeft ? r.left - 8 : r.right + 8) + 'px';
		hand.style.top = Math.min(window.innerHeight - 60, r.top + Math.min(r.height / 2, 90)) + 'px';
	};
	window.addEventListener('resize', place);

	const go = (n: number) => {
		if (n < 0) return;
		if (n >= live.length) {
			end(true);
			return;
		}
		idx = n;
		const s = live[idx]!;
		const el = pick(s.sel);
		if (!el) {
			go(n + 1);
			return;
		}
		const root = document.documentElement;
		const prev = root.style.scrollBehavior;
		root.style.scrollBehavior = 'auto';
		el.scrollIntoView({ block: 'center', behavior: 'auto' });
		root.style.scrollBehavior = prev;

		window.setTimeout(() => {
			const leg = opts.legLabel
				? `<span class="tour-pop__leg">${opts.legLabel}${opts.legOf ? ` · ${opts.legOf}` : ''}</span>`
				: '';
			pop.innerHTML =
				'<button type="button" class="tour-pop__close" data-end aria-label="End tour">×</button>' +
				leg +
				`<h4>${s.title}</h4><p>${s.body}</p>` +
				'<div class="tour-pop__row"><span class="tour-pop__count">' +
				(idx + 1) +
				' / ' +
				live.length +
				'</span><div class="tour-pop__btns">' +
				(idx > 0 ? '<button class="tour-btn tour-btn--ghost" data-back>Back</button>' : '') +
				'<button class="tour-btn tour-btn--primary" data-next>' +
				(idx === live.length - 1 ? (opts.onDone ? 'Next stop' : 'Done') : 'Next') +
				'</button></div></div>';
			place();
			hand.classList.remove('is-tap');
			void hand.offsetWidth;
			hand.classList.add('is-tap');
			pop.querySelector('[data-next]')?.addEventListener('click', () => go(idx + 1));
			pop.querySelector('[data-back]')?.addEventListener('click', () => go(idx - 1));
			// the card sits inside the overlay, and the overlay's own
			// click-away handler would otherwise swallow this one first
			pop.querySelector('[data-end]')?.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				end();
			});
		}, 80);
	};

	go(0);
}

/** Ask which door they want, then open it. */
export function openTourChooser(pageSteps: TourStep[], legs: TourLeg[]) {
	document.querySelector('.tour-doors')?.remove();
	const wrap = document.createElement('div');
	wrap.className = 'tour-doors';
	wrap.innerHTML = `
		<div class="tour-doors-veil" data-close></div>
		<div class="tour-doors-card" role="dialog" aria-modal="true">
			<button class="tour-doors-x" data-close aria-label="Close">×</button>
			<span class="tour-doors-k">Take the tour</span>
			<h3 class="tour-doors-h">How much would you like to see?</h3>
			<div class="tour-doors-row">
				<button class="tour-door" data-door="page">
					<span class="tour-door-ic" aria-hidden="true">📄</span>
					<strong>Just this page</strong>
					<em>A quick walk around the screen you are on. Under a minute.</em>
				</button>
				<button class="tour-door" data-door="full">
					<span class="tour-door-ic" aria-hidden="true">🗺️</span>
					<strong>The full tour</strong>
					<em>${legs.length} stops across the site: who we are, what we have shipped, and how to reach us.</em>
				</button>
			</div>
		</div>`;
	document.body.appendChild(wrap);
	document.documentElement.classList.add('tour-open');
	requestAnimationFrame(() => wrap.classList.add('is-on'));

	const shut = () => {
		document.removeEventListener('keydown', onKey);
		wrap.remove();
		document.documentElement.classList.remove('tour-open');
	};
	// Escape closes it too, the way every other dialog on the site does
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') shut();
	};
	document.addEventListener('keydown', onKey);
	wrap.querySelectorAll('[data-close]').forEach((b) =>
		b.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			shut();
		})
	);
	wrap.querySelector('[data-door="page"]')?.addEventListener('click', () => {
		shut();
		startTour(pageSteps);
	});
	wrap.querySelector('[data-door="full"]')?.addEventListener('click', () => {
		shut();
		write({ legs, i: 0 });
		runLeg();
	});
}

/** Run the leg the saved tour is currently on, jumping pages when needed. */
function runLeg() {
	const st = read();
	if (!st) return;
	const leg = st.legs[st.i];
	if (!leg) {
		write(null);
		return;
	}
	if (location.pathname.replace(/\/$/, '') !== leg.path.replace(/\/$/, '')) {
		location.href = leg.path;
		return;
	}
	startTour(leg.steps, {
		legLabel: leg.label,
		legOf: `stop ${st.i + 1} of ${st.legs.length}`,
		onDone: () => {
			const next = { legs: st.legs, i: st.i + 1 };
			if (next.i >= next.legs.length) {
				write(null);
				finale();
				return;
			}
			write(next);
			location.href = next.legs[next.i]!.path;
		},
	});
}

/** The last word, once the whole tour is walked. */
function finale() {
	const wrap = document.createElement('div');
	wrap.className = 'tour-doors is-on';
	wrap.innerHTML = `
		<div class="tour-doors-veil" data-close></div>
		<div class="tour-doors-card" role="dialog" aria-modal="true">
			<button class="tour-doors-x" data-close aria-label="Close">×</button>
			<span class="tour-doors-k">${lex().endK}</span>
			<h3 class="tour-doors-h">${lex().endH}</h3>
			<div class="tour-doors-row tour-doors-row--end">
				<a class="tour-door" href="/contact"><span class="tour-door-ic" aria-hidden="true">✉️</span><strong>Tell us what you are building</strong><em>Four boxes, and a reply within a business day.</em></a>
				<a class="tour-door" href="/programs"><span class="tour-door-ic" aria-hidden="true">🎓</span><strong>Apply to join us</strong><em>An IT / SIWES internship or your service year, on live client work.</em></a>
			</div>
			<a class="tour-doors-home" href="/">
				<span aria-hidden="true">←</span>
				Back to the home page
			</a>
		</div>`;
	document.body.appendChild(wrap);
	document.documentElement.classList.add('tour-open');
	const shut = () => {
		wrap.remove();
		document.documentElement.classList.remove('tour-open');
	};
	wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', shut));
	// following a link ends the card too, or it would ride along to the next page
	wrap.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', shut));
}

/** Called on every page load: picks the tour back up where it left off. */
export function resumeTour() {
	// a card or spotlight left over from the page before has no business here
	document.querySelectorAll('.tour-doors, .tour-overlay').forEach((n) => n.remove());
	document.documentElement.classList.remove('tour-open');
	document.body.style.overflow = '';

	const st = read();
	if (!st) return;
	const leg = st.legs[st.i];
	if (!leg) {
		write(null);
		return;
	}
	if (location.pathname.replace(/\/$/, '') !== leg.path.replace(/\/$/, '')) return;
	window.setTimeout(runLeg, 700);
}

/** The whole-site walk. Every leg names a few candidate selectors so the
 *  same plan works in whichever world the visitor is standing in. */
export function siteLegs(pageSteps: TourStep[]): TourLeg[] {
	return [
		{ path: '/', label: lex().home, steps: pageSteps.slice(0, 6) },
		{
			path: '/about',
			label: 'Who we are',
			steps: [
				{ sel: '[data-tour="who"], .ca-open, .fa-open, .ba-open, .sa-open, .bd-about-hero', title: 'The people, not the pitch', body: 'One team of designers, engineers and marketers, behind sixty-five products that are live right now.' },
				{ sel: '[data-tour="mission"], .ca-pin--mission', title: 'Our mission', body: 'Why we get up in the morning, in one paragraph and no jargon.' },
				{ sel: '[data-tour="vision"], .ca-pin--vision', title: 'Our vision', body: 'Where we are taking this, and who we want in the room when we get there.' },
				{ sel: '[data-tour="story"], .ca-time, .fa-time, .ba-git, .sa-time', title: 'Every year since 2019', body: 'The whole run, and what we shipped in each of them.' },
			],
		},
		{
			path: '/portfolio',
			label: 'What we have shipped',
			steps: [
				{ sel: '#cp-show, .pf-deck, .cf-show, .sp-spot, .pb-console', title: 'The showcase', body: 'Real products, live on the internet. It runs itself, or pick one to jump straight to it.' },
				{ sel: '.cf-fair, .pf-featured, .cs-featured, .sp-exhibit', title: 'The work worth reading', body: 'The full write-ups: the brief, the build, and what happened next.' },
				{ sel: '#cf-cabinet, .cf-shelf, .pf-grid, #sp-wall', title: 'Everything else', body: 'The whole catalogue, filterable by sector. Tap any one to read it.' },
			],
		},
		{
			path: '/programs',
			label: 'How to join us',
			steps: [
				{ sel: '#pg-tracks', title: 'Two ways in', body: 'An IT / SIWES internship, or your NYSC service year with us. Pick one and the cards switch to it.' },
				{ sel: '.pg-plan', title: 'The plan', body: 'We teach you, you learn, we put you on a live project, you grow.' },
				{ sel: '#apply', title: 'The application', body: 'Read by a person. The last two questions carry the most weight.' },
			],
		},
		{
			path: '/contact',
			label: 'Say hello',
			steps: [
				{ sel: '#ck-form .ck-book, .ct-formcard, .cbx-ide, .fct-form', title: 'The enquiry form', body: 'Four boxes and two minutes. No brief is too rough to send.' },
				{ sel: '.ck-chatrow, .ct-aside, .cbx-sh, .fct-lines', title: 'Or catch us anywhere', body: 'Live chat, WhatsApp, phone, or the office door in Lokogoma.' },
			],
		},

	];
}
