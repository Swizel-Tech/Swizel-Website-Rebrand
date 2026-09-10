import { openTourChooser, siteLegs, type TourStep } from './tour';

export function initFounderView() {
	// Same law as campus: the tour is bound at the bottom of this function,
	// so a missing console must never take the tour down with it.
	const w = document.getElementById('founder-widget');
	if (!w) {
		bindFounderTour();
		return;
	}
	const ring = document.getElementById('fw-ring') as SVGCircleElement | null;
	const pct = document.getElementById('fw-pct');
	const btn = w.querySelector<HTMLButtonElement>('[data-fw-launch]');
	const btnTxt = w.querySelector<HTMLElement>('.fw--launch-txt');
	const stages = Array.from(w.querySelectorAll<HTMLElement>('.fw--stage'));
	const CIRC = 326.7;
	let raf = 0;
	let running = false;

	const reset = () => {
		stages.forEach((s) => s.classList.remove('is-done'));
		w.classList.remove('is-launched');
		if (ring) ring.style.strokeDashoffset = String(CIRC);
		if (pct) pct.textContent = '0%';
	};

	const launch = () => {
		if (running) return;
		running = true;
		cancelAnimationFrame(raf);
		reset();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) {
			stages.forEach((s) => s.classList.add('is-done'));
			if (ring) ring.style.strokeDashoffset = '0';
			if (pct) pct.textContent = '100%';
			w.classList.add('is-launched');
			if (btnTxt) btnTxt.textContent = 'Launch again';
			running = false;
			return;
		}
		const dur = 2800;
		const start = performance.now();
		const tick = (now: number) => {
			const p = Math.min((now - start) / dur, 1);
			const eased = 1 - Math.pow(1 - p, 2);
			const v = Math.round(eased * 100);
			if (pct) pct.textContent = v + '%';
			if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - eased));
			stages.forEach((s) => {
				if (v >= Number(s.dataset.pct || '100')) s.classList.add('is-done');
			});
			if (p < 1) raf = requestAnimationFrame(tick);
			else {
				w.classList.add('is-launched');
				if (btnTxt) btnTxt.textContent = 'Launch again';
				running = false;
			}
		};
		raf = requestAnimationFrame(tick);
	};

	btn?.addEventListener('click', launch);

	const isFounder = () =>
		document.documentElement.getAttribute('data-view') === 'founder';
	if (isFounder()) setTimeout(launch, 500);
	window.addEventListener('swizel:viewchange', (e) => {
		if ((e as CustomEvent).detail === 'founder') setTimeout(launch, 350);
	});

	bindFounderStages(w);
	bindFounderTour();
}

/** Every week on the console is a control: press one and the ring, the
 *  percentage and the deliverables sheet all move to that week. */
function bindFounderStages(w: HTMLElement) {
	const ring = document.getElementById('fw-ring') as SVGCircleElement | null;
	const pct = document.getElementById('fw-pct');
	const stages = Array.from(w.querySelectorAll<HTMLElement>('.fw--stage'));
	const sheets = Array.from(w.querySelectorAll<HTMLElement>('[data-sheet]'));
	const CIRC = 326.7;

	stages.forEach((stage, i) => {
		stage.addEventListener('click', () => {
			const v = Number(stage.dataset.pct || '0');
			stages.forEach((s2, k) => {
				s2.classList.toggle('is-open', k === i);
				s2.classList.toggle('is-done', k <= i);
				s2.setAttribute('aria-pressed', k === i ? 'true' : 'false');
			});
			sheets.forEach((sh, k) => {
				sh.hidden = k !== i;
			});
			if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - v / 100));
			if (pct) pct.textContent = v + '%';
		});
	});
}

/** The tour walks the whole founder world, hero to footer. */
function bindFounderTour() {
	const steps: TourStep[] = [
		{
			sel: '.hero-founder .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it.',
		},
		{
			sel: '.hero-founder [data-tour="reel"]',
			title: 'A minute with the founder',
			body: 'Portrait, unscripted, and it starts on its own. Tap the frame for sound.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Five worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.fbody .fd-open',
			title: 'Day 0',
			body: 'Momentum is the moat. You bring the idea — we bring the senior team.',
		},
		{
			sel: '#founder-widget [data-tour="ring"]',
			title: 'The launch console',
			body: 'Run a whole launch, or press any week to see exactly what lands on your side of the table.',
		},
		{
			sel: '#fd-deck',
			title: 'What we actually do',
			body: 'Seven slides, seven disciplines, a real product behind each. Kill the lights for the full-screen version.',
		},
		{
			sel: '#fd-track',
			title: 'The six-week plan',
			body: 'Discover, design, build, launch — a roadmap you can hold us to.',
		},
		{
			sel: '#fd-chart',
			title: 'Built for the curve',
			body: 'Analytics from day one, and a stack that scales when things work.',
		},
		{
			sel: '#fd-wall',
			title: 'Receipts',
			body: 'Founders we launched — live products, pulsing in production right now.',
		},
		{
			sel: '#fd-chat',
			title: 'The group chat',
			body: 'Real founders, real messages. Watch the thread play out.',
		},
		{
			sel: '#fd-founder',
			title: 'From our founder',
			body: 'A word from Engr. Tochukwu Nnamdi-Nwaeze — founder to founder.',
		},
		{
			sel: '.fd-pass',
			title: 'Your boarding pass',
			body: 'Idea → Production, Gate: Week 1. Claim your launch window or call us directly.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates and behind the scenes — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="founder"]')
		.forEach((b) => b.addEventListener('click', () => openTourChooser(steps, siteLegs(steps))));
}
