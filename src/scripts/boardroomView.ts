import { startTour, type TourStep } from './tour';

export function initBoardroomView() {
	const hero = document.querySelector('.hero-boardroom');
	if (!hero) return;
	const steps: TourStep[] = [
		{
			sel: '.hero-boardroom .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it. The same signature rides every view.',
		},
		{
			sel: '.hero-boardroom .hero--photo-card',
			title: 'A real team',
			body: 'Senior engineers and designers who deliver. The people you will actually work with.',
		},
		{
			sel: '#boardroom-impact',
			title: 'Proven impact',
			body: 'On-time delivery and steady, year on year growth in the products we ship.',
		},
		{
			sel: '.hero-boardroom .hero--industries',
			title: 'Across sectors',
			body: 'Fintech, health, agric, sports and more. We have shipped where it matters.',
		},
		{
			sel: '.hero-boardroom .hero--stats',
			title: '7+ years',
			body: '65+ products and 25+ specialists behind every engagement.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="boardroom"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
