import { startTour, type TourStep } from './tour';

export function initStudioView() {
	const g = document.getElementById('studio-gallery');
	if (!g) return;
	const slides = Array.from(g.querySelectorAll<HTMLElement>('.sg--slide'));
	const thumbs = Array.from(g.querySelectorAll<HTMLElement>('.sg--thumb'));
	if (!slides.length) return;
	let cur = 0;
	let timer = 0;

	const show = (n: number) => {
		cur = (n + slides.length) % slides.length;
		slides.forEach((s, i) => s.classList.toggle('is-active', i === cur));
		thumbs.forEach((t, i) => t.classList.toggle('is-active', i === cur));
	};
	const next = () => show(cur + 1);
	const prev = () => show(cur - 1);

	const startAuto = () => {
		stopAuto();
		timer = window.setInterval(next, 3200);
	};
	const stopAuto = () => {
		if (timer) window.clearInterval(timer);
		timer = 0;
	};

	g.querySelector('[data-sg-next]')?.addEventListener('click', () => {
		next();
		startAuto();
	});
	g.querySelector('[data-sg-prev]')?.addEventListener('click', () => {
		prev();
		startAuto();
	});
	thumbs.forEach((t) =>
		t.addEventListener('click', () => {
			show(Number(t.dataset.go || '0'));
			startAuto();
		})
	);
	g.addEventListener('pointerenter', stopAuto);
	g.addEventListener('pointerleave', startAuto);

	const isStudio = () =>
		document.documentElement.getAttribute('data-view') === 'studio';
	if (isStudio()) startAuto();
	window.addEventListener('swizel:viewchange', (e) => {
		const v = (e as CustomEvent).detail;
		if (v === 'studio') {
			show(0);
			startAuto();
		} else stopAuto();
	});

	// the tour walks the whole studio world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-studio .rhead',
			title: 'Our promise',
			body: 'You imagine it. We design, build, scale and launch it.',
		},
		{
			sel: '#studio-gallery .sg--stage',
			title: 'Real work',
			body: 'A living gallery of products we designed and shipped. It plays on its own, or take control.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Six worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.sd-atrium .sd-centerpiece',
			title: 'The atrium',
			body: 'Welcome to The Swizel Gallery — Vol. on view now. A studio whose work lives in the real world.',
		},
		{
			sel: '#sd-work',
			title: 'The Collection',
			body: 'Every piece on the wall, labelled like a museum. Click any work to visit it live.',
		},
		{
			sel: '.sd-exhibit',
			title: 'Featured exhibitions',
			body: 'The big rooms — full case studies of the brands we built end to end.',
		},
		{
			sel: '.sd-craft',
			title: 'The crafts',
			body: 'Branding, UI/UX, web & mobile, motion — what the studio is commissioned for.',
		},
		{
			sel: '.sd-sheet',
			title: 'Behind the glass',
			body: 'A taped contact sheet: research, concept, craft, ship. How a piece gets made.',
		},
		{
			sel: '#sd-pull',
			title: 'In their words',
			body: 'Real clients, set in serif italic. Quiet confidence, on rotation.',
		},
		{
			sel: '.sd-cta',
			title: 'Commission us',
			body: 'Your brand deserves better clothes. Commission the studio, or call directly.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates and behind the scenes — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="studio"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
