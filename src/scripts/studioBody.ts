// Studio world (The Gallery): scroll reveals and the rotating guestbook
// quote. The work is shown directly on the wall — no reveal tricks.
export function initStudioBody() {
	const body = document.querySelector('.sbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
			quotes[i].classList.remove('is-live');
			i = (n + quotes.length) % quotes.length;
			quotes[i].classList.add('is-live');
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
