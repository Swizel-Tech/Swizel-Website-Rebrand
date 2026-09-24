// Studio world (The Gallery): scroll reveals, the rotating guestbook quote
// and the portfolio Spotlight Room. The work is shown directly on the wall.
export function initStudioBody() {
	const body = document.querySelector('.sbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── the Spotlight Room: a carousel under the lamp ──
	// Each card is handed one number, its offset from the front; the
	// stylesheet turns that into position, depth, angle and dimming.
	const spot = body.querySelector<HTMLElement>('#sp-spot');
	if (spot && !spot.dataset.spBound) {
		spot.dataset.spBound = '1';
		const cards = Array.from(spot.querySelectorAll<HTMLElement>('[data-sp-card]'));
		const ticks = Array.from(spot.querySelectorAll<HTMLElement>('[data-sp-go]'));
		const name = spot.querySelector<HTMLElement>('#sp-spot-name');
		const meta = spot.querySelector<HTMLElement>('#sp-spot-meta');
		const visit = spot.querySelector<HTMLAnchorElement>('#sp-spot-visit');
		const plaque = spot.querySelector<HTMLElement>('#sp-spot-plaque');
		const n = cards.length;
		let at = 0;
		let timer = 0;

		const place = () => {
			cards.forEach((card, i) => {
				let o = i - at;
				if (o > n / 2) o -= n;
				if (o < -n / 2) o += n;
				card.style.setProperty('--o', String(o));
				card.classList.toggle('is-live', o === 0);
				if (Math.abs(o) > 2) card.setAttribute('data-far', '');
				else card.removeAttribute('data-far');
			});
			ticks.forEach((t, i) => t.classList.toggle('is-on', i === at));

			const live = cards[at];
			if (!live) return;
			const c = live.dataset.color;
			if (c) spot.style.setProperty('--c', c);
			if (name) name.textContent = live.dataset.name || '';
			if (meta) meta.textContent = live.dataset.meta || '';
			if (visit) {
				visit.href = live.dataset.href || '/portfolio';
				if (live.dataset.out) {
					visit.target = '_blank';
					visit.rel = 'noopener noreferrer';
					visit.dataset.leaving = live.dataset.host || '';
					visit.dataset.leavingName = live.dataset.name || '';
				} else {
					visit.removeAttribute('target');
					visit.removeAttribute('rel');
					delete visit.dataset.leaving;
					delete visit.dataset.leavingName;
				}
			}
			if (plaque) {
				plaque.classList.remove('sp-pop');
				void plaque.offsetWidth;
				plaque.classList.add('sp-pop');
			}
		};
		const go = (i: number) => { at = ((i % n) + n) % n; place(); };
		const turn = (d: number) => go(at + d);

		const stop = () => { window.clearInterval(timer); timer = 0; };
		const start = () => {
			if (reduce || n < 2) return;
			stop();
			timer = window.setInterval(() => turn(1), 3800);
		};

		spot.querySelector('[data-sp-next]')?.addEventListener('click', () => { turn(1); start(); });
		spot.querySelector('[data-sp-prev]')?.addEventListener('click', () => { turn(-1); start(); });
		ticks.forEach((t, i) => t.addEventListener('click', () => { go(i); start(); }));
		// a card that is not at the front comes forward; the front one opens
		cards.forEach((card, i) =>
			card.addEventListener('click', () => {
				if (i !== at) { go(i); start(); return; }
				const href = card.dataset.href;
				if (!href) return;
				if (!card.dataset.out) { window.location.href = href; return; }
				// Off our turf: ask first, exactly as every other outbound link does.
				const leave = (window as any).swizelLeave;
				if (leave) leave(href, card.dataset.host || '', card.dataset.name || '');
				else window.open(href, '_blank', 'noopener,noreferrer');
			})
		);
		spot.addEventListener('pointerenter', stop);
		spot.addEventListener('pointerleave', start);

		place();
		start();
	}

	// ── scroll reveals ──
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.sd-rev'));
	if (reveals.length) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.12 }
		);
		reveals.forEach((r) => io.observe(r));
	}

	// ── the guestbook: auto-rotates, but you can swipe / click too ──
	const pull = body.querySelector<HTMLElement>('#sd-pull');
	if (pull) {
		const quotes = Array.from(pull.querySelectorAll<HTMLElement>('.sd-quote'));
		const ticks = Array.from(pull.querySelectorAll<HTMLElement>('[data-tick]'));
		let i = 0;
		let timer = 0;
		const show = (n: number) => {
			quotes[i]!.classList.remove('is-live');
			i = (n + quotes.length) % quotes.length;
			quotes[i]!.classList.add('is-live');
			ticks.forEach((t, ti) => t.classList.toggle('is-on', ti === i));
		};
		const start = () => {
			if (timer || reduce || quotes.length < 2) return;
			timer = window.setInterval(() => show(i + 1), 5000);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		// a manual move pauses the auto-rotate, then resumes
		const go = (n: number) => {
			stop();
			show(n);
			start();
		};
		pull
			.querySelector('#sd-pull-prev')
			?.addEventListener('click', () => go(i - 1));
		pull
			.querySelector('#sd-pull-next')
			?.addEventListener('click', () => go(i + 1));
		ticks.forEach((t, ti) =>
			t.addEventListener('click', () => go(ti))
		);

		// drag / swipe left-right
		let downX: number | null = null;
		pull.addEventListener('pointerdown', (e) => {
			downX = e.clientX;
		});
		pull.addEventListener('pointerup', (e) => {
			if (downX === null) return;
			const dx = e.clientX - downX;
			downX = null;
			if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
		});
		// keyboard arrows when focused
		pull.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') go(i - 1);
			else if (e.key === 'ArrowRight') go(i + 1);
		});

		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.3 }
		);
		io.observe(pull);
		pull.addEventListener('pointerenter', stop);
		pull.addEventListener('pointerleave', start);
	}
}
