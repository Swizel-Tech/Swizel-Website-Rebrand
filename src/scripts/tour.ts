// Lightweight spotlight guided tour. Reused by every view.
export type TourStep = { sel: string; title: string; body: string };

export function startTour(steps: TourStep[]) {
	if (!steps.length) return;
	// avoid stacking multiple tours
	document.querySelector('.tour-overlay')?.remove();

	let idx = 0;
	const overlay = document.createElement('div');
	overlay.className = 'tour-overlay';
	const hole = document.createElement('div');
	hole.className = 'tour-hole';
	const pop = document.createElement('div');
	pop.className = 'tour-pop';
	overlay.appendChild(hole);
	overlay.appendChild(pop);
	document.body.appendChild(overlay);
	document.body.style.overflow = 'hidden';

	const end = () => {
		overlay.remove();
		document.body.style.overflow = '';
		window.removeEventListener('keydown', key);
	};
	const key = (e: KeyboardEvent) => {
		if (e.key === 'Escape') end();
		else if (e.key === 'ArrowRight') go(idx + 1);
		else if (e.key === 'ArrowLeft') go(idx - 1);
	};
	window.addEventListener('keydown', key);

	const go = (n: number) => {
		if (n < 0) return;
		if (n >= steps.length) {
			end();
			return;
		}
		idx = n;
		const s = steps[idx];
		const el = document.querySelector<HTMLElement>(s.sel);
		if (!el) {
			go(n + 1);
			return;
		}
		// jump instantly — measuring mid-smooth-scroll puts the spotlight
		// in the wrong place (html has scroll-behavior: smooth, so force it)
		const root = document.documentElement;
		const prevBehavior = root.style.scrollBehavior;
		root.style.scrollBehavior = 'auto';
		el.scrollIntoView({ block: 'center', behavior: 'auto' });
		root.style.scrollBehavior = prevBehavior;
		setTimeout(() => {
			const r = el.getBoundingClientRect();
			const pad = 8;
			hole.style.left = r.left - pad + 'px';
			hole.style.top = r.top - pad + 'px';
			hole.style.width = r.width + pad * 2 + 'px';
			hole.style.height = r.height + pad * 2 + 'px';

			pop.innerHTML =
				'<button class="tour-pop__close" data-end aria-label="End tour">×</button>' +
				'<h4>' +
				s.title +
				'</h4><p>' +
				s.body +
				'</p><div class="tour-pop__row"><span class="tour-pop__count">' +
				(idx + 1) +
				' / ' +
				steps.length +
				'</span><div class="tour-pop__btns">' +
				(idx > 0
					? '<button class="tour-btn tour-btn--ghost" data-back>Back</button>'
					: '') +
				'<button class="tour-btn tour-btn--primary" data-next>' +
				(idx === steps.length - 1 ? 'Done' : 'Next') +
				'</button></div></div>';

			const pw = pop.offsetWidth;
			const ph = pop.offsetHeight;
			let top = r.bottom + 14;
			if (top + ph > window.innerHeight - 12)
				top = Math.max(12, r.top - ph - 14);
			let left = r.left;
			if (left + pw > window.innerWidth - 12)
				left = window.innerWidth - 12 - pw;
			if (left < 12) left = 12;
			pop.style.top = top + 'px';
			pop.style.left = left + 'px';

			pop
				.querySelector('[data-next]')
				?.addEventListener('click', () => go(idx + 1));
			pop
				.querySelector('[data-back]')
				?.addEventListener('click', () => go(idx - 1));
			pop
				.querySelector('[data-end]')
				?.addEventListener('click', () => end());
		}, 80);
	};

	go(0);
}
