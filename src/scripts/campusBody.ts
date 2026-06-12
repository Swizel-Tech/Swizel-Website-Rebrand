// Campus world: scroll reveals, XP counters, the quest bar fill with
// popping level nodes, and the achievements unlock sequence.
export function initCampusBody() {
	const body = document.querySelector('.cbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── scroll reveals ──
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.cp-rev'));
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
			{ threshold: 0.15 }
		);
		reveals.forEach((r) => io.observe(r));
	}

	// ── counters ──
	const counts = Array.from(body.querySelectorAll<HTMLElement>('[data-count]'));
	if (counts.length) {
		const run = (el: HTMLElement) => {
			const t = Number(el.dataset.count || '0');
			const sfx = el.dataset.suffix || '';
			if (reduce || t === 0) {
				el.textContent = t + sfx;
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / 1200, 1);
				el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * t) + sfx;
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

	// ── the teacher wrote today's date on the whiteboard ──
	const boardDate = body.querySelector<HTMLElement>('#cp-board-date');
	if (boardDate) {
		boardDate.textContent = new Date().toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}

	// ── the chalkboard rotates its facts; the chalk sticks page it ──
	const chalk = body.querySelector<HTMLElement>('#cp-chalk');
	if (chalk) {
		const facts = Array.from(chalk.querySelectorAll<HTMLElement>('.cp-fact'));
		const count = chalk.querySelector<HTMLElement>('#cp-chalk-count');
		let i = 0;
		let timer = 0;
		const show = (n: number) => {
			facts[i].classList.remove('is-live');
			i = (n + facts.length) % facts.length;
			facts[i].classList.add('is-live');
			if (count) count.textContent = `${i + 1} / ${facts.length}`;
		};
		const start = () => {
			if (timer || reduce || facts.length < 2) return;
			timer = window.setInterval(() => show(i + 1), 5200);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		// the chalk pieces in the tray are the prev / next buttons
		chalk.querySelector('#cp-chalk-prev')?.addEventListener('click', () => {
			stop();
			show(i - 1);
			start();
		});
		chalk.querySelector('#cp-chalk-next')?.addEventListener('click', () => {
			stop();
			show(i + 1);
			start();
		});
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.3 }
		);
		io.observe(chalk);
		chalk.addEventListener('pointerenter', stop);
		chalk.addEventListener('pointerleave', start);
	}

	// ── quest bar + achievements unlock when they enter view ──
	['#cp-questline', '#cp-achvs'].forEach((sel) => {
		const el = body.querySelector<HTMLElement>(sel);
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.3 }
		);
		io.observe(el);
	});
}
