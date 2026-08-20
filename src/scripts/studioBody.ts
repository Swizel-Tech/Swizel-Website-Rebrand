// Studio world (The Gallery): scroll reveals, the rotating guestbook quote
// and the portfolio Spotlight Room. The work is shown directly on the wall.
export function initStudioBody() {
	const body = document.querySelector('.sbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── the Spotlight Room: one work under the light at a time ──
	const spot = body.querySelector<HTMLElement>('#sp-spot');
	if (spot && !spot.dataset.spBound) {
		spot.dataset.spBound = '1';
		const items = Array.from(
			spot.querySelectorAll<HTMLElement>('[data-sp-item]')
		).map((el) => ({
			img: el.dataset.img || '',
			name: el.dataset.name || '',
			meta: el.dataset.meta || '',
			room: el.dataset.room || '',
			color: el.dataset.color || '',
		}));
		const imgs = [
			spot.querySelector<HTMLImageElement>('#sp-spot-a')!,
			spot.querySelector<HTMLImageElement>('#sp-spot-b')!,
		];
		const name = spot.querySelector<HTMLElement>('#sp-spot-name')!;
		const meta = spot.querySelector<HTMLElement>('#sp-spot-meta')!;
		const room = spot.querySelector<HTMLElement>('#sp-spot-room')!;
		const plaque = spot.querySelector<HTMLElement>('#sp-spot-plaque')!;
		const thumbs = Array.from(
			spot.querySelectorAll<HTMLElement>('[data-sp-go]')
		);
		let cur = 0;
		let front = 0;
		let timer = 0;

		const show = (n: number) => {
			cur = (n + items.length) % items.length;
			const it = items[cur]!;
			// the light dips while the piece is swapped
			spot.classList.add('sp-dim');
			const back = imgs[1 - front]!;
			back.src = it.img;
			back.alt = it.name;
			requestAnimationFrame(() => {
				back.classList.add('is-on');
				imgs[front]!.classList.remove('is-on');
				front = 1 - front;
				spot.style.setProperty('--c', it.color);
				name.textContent = it.name;
				meta.textContent = it.meta;
				room.textContent = it.room;
				plaque.classList.remove('sp-pop');
				void plaque.offsetWidth;
				plaque.classList.add('sp-pop');
				thumbs.forEach((t, ti) => t.classList.toggle('is-on', ti === cur));
				window.setTimeout(() => spot.classList.remove('sp-dim'), 300);
			});
		};
		const start = () => {
			if (timer || reduce || items.length < 2) return;
			timer = window.setInterval(() => show(cur + 1), 3400);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		thumbs.forEach((t) =>
			t.addEventListener('click', () => {
				stop();
				show(Number(t.dataset.spGo || '0'));
				start();
			})
		);
		spot.addEventListener('pointerenter', stop);
		spot.addEventListener('pointerleave', start);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.25 }
		);
		io.observe(spot);
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
