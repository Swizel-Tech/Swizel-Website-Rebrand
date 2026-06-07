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

	const steps: TourStep[] = [
		{
			sel: '.hero-founder .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it. The same signature rides every view.',
		},
		{
			sel: '#founder-widget [data-tour="ring"]',
			title: 'Idea to MVP',
			body: 'Watch a build go from zero to launched. Most MVPs ship in about six weeks.',
		},
		{
			sel: '#founder-widget .fw--stages',
			title: 'A clear path',
			body: 'Four simple stages: discover, design, build, launch. No mystery and no surprises.',
		},
		{
			sel: '#founder-widget [data-tour="launched"]',
			title: 'Proof, across sectors',
			body: 'Real products we launched, spanning food, sports, real estate and commerce.',
		},
		{
			sel: '.hero-founder [data-tour="team"]',
			title: 'Your build team',
			body: 'Real people who ship with you. Tap to meet them.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="founder"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
