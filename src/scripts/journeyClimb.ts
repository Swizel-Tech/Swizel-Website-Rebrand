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
		const line = clb.querySelector<SVGGeometryElement>('[data-clb-line]');
		const clip = clb.querySelector<SVGRectElement>('[data-clb-clip]');
		if (pins.length < 2 || cards.length !== pins.length) return;

		// How far along the route each stop sits, as a fraction of the whole
		// ridge. The line is only stroked up to the current stop, so the route
		// draws itself in behind the climber instead of being finished before
		// the visitor arrives.
		let total = 0;
		const reach: number[] = [];
		try {
			const pts = (line?.getAttribute('points') || '')
				.trim()
				.split(/\s+/)
				.map((pair) => pair.split(',').map(Number) as [number, number]);
			let run = 0;
			reach.push(0);
			for (let i = 1; i < pts.length; i++) {
				const [x0, y0] = pts[i - 1]!;
				const [x1, y1] = pts[i]!;
				run += Math.hypot(x1 - x0, y1 - y0);
				reach.push(run);
			}
			total = line ? line.getTotalLength() : run;
			if (run > 0) for (let i = 0; i < reach.length; i++) reach[i] = reach[i]! / run;
		} catch (e) {
			/* a browser without getTotalLength keeps the plain line */
		}
		if (line && total > 0) {
			line.style.strokeDasharray = String(total);
			line.style.strokeDashoffset = String(total);
		}

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
			if (bar) bar.style.width = `${((at + 1) / pins.length) * 100}%`;

			// the route, drawn as far as the climb has got
			const frac = reach[at] ?? at / Math.max(pins.length - 1, 1);
			if (line && total > 0) {
				line.style.strokeDashoffset = String(total * (1 - frac));
			}
			if (clip) clip.setAttribute('width', String(Math.max(frac, 0.001) * 1000));

			// a short step animation while it is on the move
			clb.classList.remove('is-walking');
			void clb.offsetWidth;
			clb.classList.add('is-walking');
		};

		const take = (i: number, park = 9000) => {
			const n = pins.length;
			at = ((i % n) + n) % n;
			clb.classList.remove('is-resetting');
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
					last = performance.now();
					if (at === pins.length - 1) {
						// back to the bottom of the hill: hide the marker, reset,
						// then bring it back, rather than flying it backwards
						// across the whole ridge
						clb.classList.add('is-resetting');
						window.setTimeout(() => {
							at = 0;
							paint();
							window.setTimeout(() => clb.classList.remove('is-resetting'), 60);
						}, 280);
					} else {
						at += 1;
						paint();
					}
				}
			}, 180);
		}

		paint();
	});
}
