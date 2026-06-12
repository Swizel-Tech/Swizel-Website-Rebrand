import { startTour, type TourStep } from './tour';

export function initFounderView() {
	const w = document.getElementById('founder-widget');
	if (!w) return;
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

	// the tour walks the whole founder world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-founder .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it.',
		},
		{
			sel: '#founder-widget [data-tour="ring"]',
			title: 'Idea to MVP',
			body: 'Watch a build go from zero to launched. Most MVPs ship in about six weeks.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Six worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.fbody .fd-open',
			title: 'Day 0',
			body: 'Momentum is the moat. You bring the idea — we bring the senior team.',
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
			sel: '.fd-qbody',
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
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
