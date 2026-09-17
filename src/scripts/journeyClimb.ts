// The climb walks itself.
//
// The marker moves to the year that is up, the card underneath changes with
// it, and the bar shows how far through the story you are. Point at a year
// and it parks there; leave it and it carries on.

export function initJourneyClimb() {
	const climbs = Array.from(document.querySelectorAll<HTMLElement>('[data-clb]'));
	if (!climbs.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	climbs.forEach((clb) => {
		if (clb.dataset.clbBound === '1') return;
		clb.dataset.clbBound = '1';

		const pins = Array.from(clb.querySelectorAll<HTMLElement>('[data-clb-pin]'));
		const cards = Array.from(clb.querySelectorAll<HTMLElement>('[data-clb-card]'));
		const walker = clb.querySelector<HTMLElement>('[data-clb-walker]');
		const bar = clb.querySelector<HTMLElement>('[data-clb-bar]');
		if (pins.length < 2 || cards.length !== pins.length) return;

		const total = pins.length;
		const every = Math.max(0, Number(clb.dataset.every || '5')) * 1000;

		let at = 0;
		let seen = false;
		let resumeAt = 0;
		let last = performance.now();

		const paint = () => {
			pins.forEach((p, i) => p.setAttribute('aria-pressed', i === at ? 'true' : 'false'));
			cards.forEach((c, i) => {
				c.classList.toggle('is-on', i === at);
				c.setAttribute('aria-hidden', i === at ? 'false' : 'true');
			});
			const node = pins[at].parentElement as HTMLElement | null;
			if (walker && node) {
				// the node already knows where it sits on the ridge; the marker
				// just borrows those two numbers
				walker.style.setProperty('--wx', node.style.getPropertyValue('--x'));
				walker.style.setProperty('--wy', node.style.getPropertyValue('--y'));
			}
			if (bar) bar.style.width = `${((at + 1) / total) * 100}%`;
		};

		const take = (i: number, park = 9000) => {
			at = ((i % total) + total) % total;
			resumeAt = performance.now() + park;
			last = performance.now();
			paint();
		};

		pins.forEach((p, i) => {
			p.addEventListener('click', () => take(i, 14000));
			p.addEventListener('pointerenter', () => take(i, 7000));
			p.addEventListener('focus', () => take(i, 14000));
		});

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(es) => es.forEach((e) => (seen = e.isIntersecting)),
				{ threshold: 0.2 }
			).observe(clb);
		} else {
			seen = true;
		}

		if (every > 0 && !reduce) {
			window.setInterval(() => {
				if (!seen || document.hidden || performance.now() < resumeAt) {
					last = performance.now();
					return;
				}
				if (performance.now() - last >= every) {
					at = (at + 1) % total;
					last = performance.now();
					paint();
				}
			}, 180);
		}

		paint();
	});
}
