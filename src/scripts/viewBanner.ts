import { views, DEFAULT_VIEW } from '../consts';
import { applyView } from './viewExperience';

// Powers the "choose your world" rail under the hero: keeps the headline
// in sync with the active view, marks the current poster (in both marquee
// copies), and switches worlds on tap.
export function initViewBanner() {
	const banner = document.getElementById('view-banner');
	if (!banner) return;

	const name = banner.querySelector<HTMLElement>('#vb-name');
	const aud = banner.querySelector<HTMLElement>('#vb-aud');
	const cards = Array.from(
		banner.querySelectorAll<HTMLButtonElement>('[data-switch-view]')
	);

	const sync = () => {
		const id =
			document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
		const v = views.find((x) => x.id === id) || views[0];
		if (name) name.textContent = v.name;
		if (aud) aud.textContent = v.audience;
		cards.forEach((c) =>
			c.classList.toggle('is-current', c.dataset.switchView === id)
		);
	};

	cards.forEach((c) =>
		c.addEventListener('click', () => {
			const id = c.dataset.switchView;
			if (!id || c.classList.contains('is-current')) return;
			applyView(id); // applyView now handles the scroll-to-top
		})
	);

	window.addEventListener('swizel:viewchange', sync);
	sync();
}
