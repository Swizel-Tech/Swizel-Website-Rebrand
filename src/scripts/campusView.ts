import { startTour, type TourStep } from './tour';

export function initCampusView() {
	const w = document.getElementById('campus-widget');
	if (!w) return;
	const fill = document.getElementById('cw-fill');
	const avatar = document.getElementById('cw-avatar');
	const xp = document.getElementById('cw-xp');
	const level = document.getElementById('cw-level');
	const btn = w.querySelector<HTMLButtonElement>('[data-cw-start]');
	const btnTxt = w.querySelector<HTMLElement>('.cw--start-txt');
	const nodes = Array.from(w.querySelectorAll<HTMLElement>('.cw--node'));
	const badges = Array.from(w.querySelectorAll<HTMLElement>('.cw--badge'));
	const MAX_XP = 2400;
	let raf = 0;
	let running = false;

	const labelFor = (v: number) => {
		if (v >= 100) return 'Level 4 · Hired 🎓';
		if (v >= 80) return 'Level 3 · Shipping';
		if (v >= 50) return 'Level 2 · Building';
		if (v >= 20) return 'Level 1 · Learning';
		return 'Level 0 · Newbie';
	};

	const reset = () => {
		nodes.forEach((n) => n.classList.remove('is-on'));
		badges.forEach((b) => b.classList.remove('is-on'));
		w.classList.remove('is-complete');
		if (fill) fill.style.width = '0%';
		if (avatar) avatar.style.left = '0%';
		if (xp) xp.textContent = '0 XP';
		if (level) level.textContent = labelFor(0);
	};

	const finish = () => {
		if (fill) fill.style.width = '100%';
		if (avatar) avatar.style.left = '100%';
		if (xp) xp.textContent = MAX_XP.toLocaleString() + ' XP';
		if (level) level.textContent = labelFor(100);
		nodes.forEach((n) => n.classList.add('is-on'));
		badges.forEach((b) => b.classList.add('is-on'));
		w.classList.add('is-complete');
		if (btnTxt) btnTxt.textContent = 'Replay';
		running = false;
	};

	const launch = () => {
		if (running) return;
		running = true;
		cancelAnimationFrame(raf);
		reset();
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			finish();
			return;
		}
		const dur = 3000;
		const start = performance.now();
		const tick = (now: number) => {
			const p = Math.min((now - start) / dur, 1);
			const eased = 1 - Math.pow(1 - p, 2);
			const v = Math.round(eased * 100);
			if (fill) fill.style.width = v + '%';
			if (avatar) avatar.style.left = v + '%';
			if (xp) xp.textContent = Math.round(eased * MAX_XP).toLocaleString() + ' XP';
			if (level) level.textContent = labelFor(v);
			nodes.forEach((n) => {
				if (v >= Number(n.dataset.pct || '100')) n.classList.add('is-on');
			});
			badges.forEach((b) => {
				if (v >= Number(b.dataset.pct || '100')) b.classList.add('is-on');
			});
			if (p < 1) raf = requestAnimationFrame(tick);
			else finish();
		};
		raf = requestAnimationFrame(tick);
	};

	btn?.addEventListener('click', launch);

	const isCampus = () =>
		document.documentElement.getAttribute('data-view') === 'campus';
	if (isCampus()) setTimeout(launch, 500);
	window.addEventListener('swizel:viewchange', (e) => {
		if ((e as CustomEvent).detail === 'campus') setTimeout(launch, 350);
	});

	const steps: TourStep[] = [
		{
			sel: '.hero-campus .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it. The same signature rides every view.',
		},
		{
			sel: '#campus-widget [data-tour="track"]',
			title: 'Level up to hired',
			body: 'Watch the journey from newbie to hired. Our bootcamp takes you from zero to job ready.',
		},
		{
			sel: '#campus-widget [data-tour="badges"]',
			title: 'Real skills',
			body: 'Web, mobile, design and marketing. You unlock each as you build.',
		},
		{
			sel: '#campus-widget [data-tour="builds"]',
			title: 'Build across sectors',
			body: 'You learn by shipping the same kinds of products we do, from food delivery to sports and commerce.',
		},
		{
			sel: '.hero-campus [data-tour="team"]',
			title: 'Your mentors',
			body: 'Real engineers and designers guide you the whole way. Tap to meet them.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="campus"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
