import { startTour, type TourStep } from './tour';

// Boardroom guided tour — walks the whole landing page, hero to footer.
export function initBoardroomView() {
	const hero = document.querySelector('.hero-boardroom');
	if (!hero) return;
	const steps: TourStep[] = [
		{
			sel: '.hero-boardroom .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it.',
		},
		{
			sel: '.hero-boardroom .hero--photo-card',
			title: 'A real team',
			body: 'Senior engineers and designers who deliver — the people you will actually work with.',
		},
		{
			sel: '#boardroom-impact',
			title: 'Proven impact',
			body: 'On-time delivery and uptime you can build a business on.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Six worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.bdbody .bd-intro',
			title: 'Built for business',
			body: 'Systems that grow revenue, cut cost and keep customers coming back.',
		},
		{
			sel: '.bd-mosaic .bd-tile',
			title: 'On time. On budget.',
			body: '98% on-time delivery across 65+ launches — you always know what ships next.',
		},
		{
			sel: '#bd-services',
			title: 'Every discipline',
			body: 'Design, development, marketing and maintenance — one roof, one team to call.',
		},
		{
			sel: '#bd-numbers',
			title: 'The numbers',
			body: '65+ products, 25+ specialists, 10+ countries, a 5.0 rating. Measured the only way that matters.',
		},
		{
			sel: '#bd-quotes',
			title: 'Client words',
			body: 'Real clients, rotating through. We keep them this happy on purpose.',
		},
		{
			sel: '#bd-work',
			title: 'The proof, shipped',
			body: 'Live products carrying real businesses — tap any to visit.',
		},
		{
			sel: '.bd-tile--cta',
			title: 'Your move',
			body: 'Start a project or call us directly. A reply within one business day.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates, behind the scenes and careers — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="boardroom"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
