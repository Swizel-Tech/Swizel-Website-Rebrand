import { startTour, type TourStep } from './tour';

export function initLegacyView() {
	const hero = document.querySelector('.hero-legacy');
	if (!hero) return;
	const steps: TourStep[] = [
		{
			sel: '.hero-legacy .rhead',
			title: 'The classic',
			body: 'The Swizel you already know. You imagine it, we build, design, scale and launch it.',
		},
		{
			sel: '.hero-legacy [data-tour="art"]',
			title: 'Team as a service',
			body: 'A full team of designers and engineers, ready to bring your idea to life.',
		},
		{
			sel: '.hero-legacy .legacy--cta',
			title: 'Start anytime',
			body: 'Tell us about your project, or switch views from the nav to see Swizel in other styles.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="legacy"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
