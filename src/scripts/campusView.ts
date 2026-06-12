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

	// the tour walks the whole campus world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-campus .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it.',
		},
		{
			sel: '#campus-widget [data-tour="track"]',
			title: 'Level up to hired',
			body: 'Watch the journey from newbie to hired — zero to job ready.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Six worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.cbody .cp-open',
			title: 'Player 1: you',
			body: 'A free, hands-on bootcamp run by the team that ships real products.',
		},
		{
			sel: '.cp-tracks',
			title: 'Choose your track',
			body: 'Web, mobile, design or marketing — pick your character.',
		},
		{
			sel: '#cp-questline',
			title: 'The main quest',
			body: 'Learn → Build → Intern → Hired. XP is earned by shipping.',
		},
		{
			sel: '.cp-ships',
			title: 'Real side quests',
			body: 'You build projects modeled on products we actually shipped for clients.',
		},
		{
			sel: '#cp-achvs',
			title: 'Achievements',
			body: 'Free start, real mentors, paid internships and a job-ready portfolio.',
		},
		{
			sel: '.cp-voices',
			title: 'Player reviews',
			body: 'Grads, five stars in. Real people who made the jump.',
		},
		{
			sel: '.cp-ctabox',
			title: 'Press START',
			body: 'Join the next cohort free — or start a project if you’re building a business.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates and behind the scenes — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="campus"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
