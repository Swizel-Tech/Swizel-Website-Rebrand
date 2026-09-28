// "Tap to expand" on the small film panels.
//
// On a phone the film in the opening two-up is about a third of the
// screen wide, which is fine as a picture and poor as a film. Every
// FilmPlayer already has a full-screen control and a play control that
// have been tested; rather than write a second lightbox, this presses
// those two in order — so expanding a film here behaves exactly like
// expanding one anywhere else on the site, including the way the bar
// stays up in full screen.
export function initFilmExpand() {
	const stages = Array.from(document.querySelectorAll<HTMLElement>('[data-film-expand]'));
	if (!stages.length) return;

	stages.forEach((stage) => {
		if (stage.dataset.expandBound === '1') return;
		stage.dataset.expandBound = '1';

		const btn = stage.querySelector<HTMLButtonElement>('[data-film-expand-btn]');
		if (!btn) return;

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const full = stage.querySelector<HTMLButtonElement>('[data-flm-full]');
			const big = stage.querySelector<HTMLButtonElement>('[data-flm-big]');
			const play = stage.querySelector<HTMLButtonElement>('[data-flm-play]');
			// full screen first, so the film opens at size rather than
			// starting small and then jumping
			full?.click();
			// the poster's own button is what mounts the player the first
			// time; after that it is gone and the transport takes over
			window.setTimeout(() => {
				if (big && big.offsetParent !== null) big.click();
				else play?.click();
			}, 120);
		});
	});
}
