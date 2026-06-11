export function initBoardroomBody() {
	const body = document.querySelector('.bdbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// calm scroll reveals
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.bd-reveal'));
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
			{ threshold: 0.18 }
		);
		reveals.forEach((r) => io.observe(r));
	}

	// counters (supports decimals for the 5.0 rating)
	const counts = Array.from(body.querySelectorAll<HTMLElement>('[data-count]'));
	if (counts.length) {
		const run = (el: HTMLElement) => {
			const t = Number(el.dataset.count || '0');
			const sfx = el.dataset.suffix || '';
			const dec = Number(el.dataset.decimals || '0');
			if (reduce) {
				el.textContent = t.toFixed(dec) + sfx;
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / 1400, 1);
				const eased = 1 - Math.pow(1 - p, 3);
				el.textContent = (eased * t).toFixed(dec) + sfx;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						run(e.target as HTMLElement);
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.6 }
		);
		counts.forEach((c) => io.observe(c));
	}

	// client words transition in and out
	const stage = body.querySelector<HTMLElement>('#bd-quotes');
	const quotes = stage
		? Array.from(stage.querySelectorAll<HTMLElement>('.bd-quote'))
		: [];
	const dots = stage
		? Array.from(stage.querySelectorAll<HTMLElement>('[data-qdot]'))
		: [];
	if (stage && quotes.length > 1) {
		let i = 0;
		let timer = 0;
		const showNext = () => {
			const cur = quotes[i];
			i = (i + 1) % quotes.length;
			const nxt = quotes[i];
			cur.classList.add('is-leaving');
			cur.classList.remove('is-live');
			window.setTimeout(() => {
				cur.classList.remove('is-leaving');
				nxt.classList.add('is-live');
			}, reduce ? 0 : 450);
			dots.forEach((d, di) => d.classList.toggle('is-on', di === i));
		};
		const start = () => {
			if (timer) return;
			timer = window.setInterval(showNext, 5200);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		// only rotate while the tile is on screen
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.3 }
		);
		io.observe(stage);
		stage.addEventListener('pointerenter', stop);
		stage.addEventListener('pointerleave', start);
	}
}
