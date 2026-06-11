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

	const steps: TourStep[] = [
		{
			sel: '.hero-studio .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it. The same signature rides every view.',
		},
		{
			sel: '#studio-gallery .sg--stage',
			title: 'Real work',
			body: 'A living gallery of products we designed and shipped. It plays on its own, or take control.',
		},
		{
			sel: '#studio-gallery .sg--cap',
			title: 'Across every sector',
			body: 'Each piece is tagged by industry, from commerce to sports, real estate, finance and beauty.',
		},
		{
			sel: '#studio-gallery [data-tour="thumbs"]',
			title: 'Explore freely',
			body: 'Tap any thumbnail to jump straight to that project.',
		},
		{
			sel: '.hero-studio [data-tour="team"]',
			title: 'The designers',
			body: 'Real people behind every pixel. Tap to say hello.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="studio"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
