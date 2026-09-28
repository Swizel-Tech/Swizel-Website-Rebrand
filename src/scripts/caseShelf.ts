// The case-study shelf on the portfolio page.
//
// The row itself is a native horizontal scroller, so dragging, flicking,
// momentum and snapping all come from the browser and behave the way they
// do everywhere else on the device. The only thing script adds is the pair
// of arrows for a mouse, which has no flick — and the greying out of an
// arrow that has nowhere left to go, because an arrow that does nothing
// when it is pressed reads as broken rather than as finished.
export function initCaseShelf() {
	const wraps = Array.from(document.querySelectorAll<HTMLElement>('[data-pf-shelf-wrap]'));
	if (!wraps.length) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	wraps.forEach((wrap) => {
		if (wrap.dataset.pfShelfReady === '1') return;
		wrap.dataset.pfShelfReady = '1';

		const shelf = wrap.querySelector<HTMLElement>('[data-pf-shelf]');
		const prev = wrap.querySelector<HTMLButtonElement>('[data-pf-shelf-prev]');
		const next = wrap.querySelector<HTMLButtonElement>('[data-pf-shelf-next]');
		if (!shelf) return;

		/** how far one press moves: whole cards, as many as are on screen */
		const stride = () => {
			const first = shelf.firstElementChild as HTMLElement | null;
			if (!first) return shelf.clientWidth;
			const card = first.getBoundingClientRect().width;
			const gap = parseFloat(getComputedStyle(shelf).columnGap || '0') || 0;
			const one = card + gap;
			// never less than one card, never more than a screenful of them
			const fit = Math.max(1, Math.floor(shelf.clientWidth / one));
			return one * fit;
		};

		// Rounded because scrollLeft comes back to a whole pixel while the
		// maximum is fractional: without the slack the right-hand arrow can
		// never switch off, since scrollLeft stops one rounding short of it.
		const sync = () => {
			const max = shelf.scrollWidth - shelf.clientWidth;
			const at = shelf.scrollLeft;
			if (prev) prev.disabled = at <= 2;
			if (next) next.disabled = at >= max - 2;
		};

		const push = (dir: 1 | -1) => {
			shelf.scrollBy({ left: dir * stride(), behavior: reduce ? 'auto' : 'smooth' });
		};

		prev?.addEventListener('click', () => push(-1));
		next?.addEventListener('click', () => push(1));
		shelf.addEventListener('scroll', sync, { passive: true });
		window.addEventListener('resize', sync);

		// The cards carry lazy screenshots, so the scrollable width grows as
		// they arrive and the arrows have to be told again.
		shelf.querySelectorAll('img').forEach((img) => {
			if (img.complete) return;
			img.addEventListener('load', sync, { once: true });
			img.addEventListener('error', sync, { once: true });
		});

		sync();
	});
}
