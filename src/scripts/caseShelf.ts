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

		// ── the row walks on by itself ──
		// Twelve cards and four on screen means eight of them are off the
		// right edge of a row that a lot of visitors will never push. So it
		// drifts, slowly, and turns round at the end rather than snapping
		// back to the start — a row that jumps to the beginning reads as
		// broken. It only moves while it is on screen and the tab is in
		// front, and it stops the moment a hand or a pointer is on it.
		if (reduce) return;

		const SPEED = 0.26; // pixels a frame, about sixteen a second
		let raf = 0;
		let held = false;
		let seen = false;
		let waitUntil = Date.now() + 1200; // let it be read before it moves
		let back = false;
		// scrollLeft reads back rounded to a whole pixel, so adding a
		// fraction of one to it every frame rounds away to nothing and the
		// row never moves. The position is kept here as a float.
		let pos = 0;

		const queue = () => {
			if (!raf) raf = requestAnimationFrame(step);
		};

		function step() {
			raf = 0;
			if (!seen || held || document.hidden) return queue();
			if (Date.now() < waitUntil) return queue();
			const max = shelf!.scrollWidth - shelf!.clientWidth;
			if (max < 8) return queue();

			// a hand, or an arrow, may have moved it since the last frame
			if (Math.abs(shelf!.scrollLeft - pos) > 2) pos = shelf!.scrollLeft;
			pos += back ? -SPEED * 2.2 : SPEED;
			pos = Math.max(0, Math.min(max, pos));
			shelf!.scrollLeft = pos;
			sync();

			if (!back && pos >= max - 1) {
				back = true;
				waitUntil = Date.now() + 1500;
			} else if (back && pos <= 1) {
				back = false;
				waitUntil = Date.now() + 1100;
			}
			queue();
		}

		// Any hand on it wins: a pointer resting on the row, a finger on it,
		// or the keyboard focus landing on one of the cards. The pause
		// outlasts the touch by a beat so the row does not creep out from
		// under a finger that has only just let go.
		const hold = () => {
			held = true;
		};
		const release = (grace = 0) => {
			held = false;
			waitUntil = Date.now() + grace;
		};
		shelf.addEventListener('pointerenter', hold);
		shelf.addEventListener('pointerleave', () => release());
		shelf.addEventListener('touchstart', hold, { passive: true });
		shelf.addEventListener('touchend', () => release(2600), { passive: true });
		shelf.addEventListener('focusin', hold);
		shelf.addEventListener('focusout', () => release(1200));
		// pressing an arrow is steering, so give the press room to land
		wrap.querySelectorAll('.pf-shelf-arrow').forEach((b) =>
			b.addEventListener('click', () => release(2600))
		);

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(entries) => {
					seen = !!entries[0]?.isIntersecting;
				},
				{ threshold: 0.2 }
			).observe(shelf);
		} else {
			seen = true;
		}
		queue();
	});
}
