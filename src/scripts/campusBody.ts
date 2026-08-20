// Campus world: scroll reveals, XP counters, the quest bar fill with
// popping level nodes, the achievements unlock sequence and the portfolio
// Show & Tell projector.
export function initCampusBody() {
	const body = document.querySelector('.cbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── the Show & Tell projector: slides click over on a loop ──
	const show = body.querySelector<HTMLElement>('#cp-show');
	if (show && !show.dataset.csBound) {
		show.dataset.csBound = '1';
		const items = Array.from(
			show.querySelectorAll<HTMLElement>('[data-cs-item]')
		).map((el) => ({
			img: el.dataset.img || '',
			name: el.dataset.name || '',
			meta: el.dataset.meta || '',
			color: el.dataset.color || '',
		}));
		const imgs = [
			show.querySelector<HTMLImageElement>('#cp-show-a')!,
			show.querySelector<HTMLImageElement>('#cp-show-b')!,
		];
		const name = show.querySelector<HTMLElement>('#cp-show-name')!;
		const meta = show.querySelector<HTMLElement>('#cp-show-meta')!;
		const count = show.querySelector<HTMLElement>('#cp-show-count')!;
		const tape = show.querySelector<HTMLElement>('#cp-show-tape')!;
		const clicks = Array.from(
			show.querySelectorAll<HTMLElement>('[data-cs-go]')
		);
		let cur = 0;
		let front = 0;
		let timer = 0;

		const goTo = (n: number) => {
			cur = (n + items.length) % items.length;
			const it = items[cur]!;
			// the projector flashes as the slide clicks over
			show.classList.add('cf-click-over');
			const back = imgs[1 - front]!;
			back.src = it.img;
			back.alt = it.name;
			window.setTimeout(() => {
				back.classList.add('is-on');
				imgs[front]!.classList.remove('is-on');
				front = 1 - front;
				show.style.setProperty('--c', it.color);
				name.textContent = it.name;
				meta.textContent = it.meta;
				count.textContent = `Slide ${cur + 1} / ${items.length}`;
				tape.classList.remove('cf-pop');
				void tape.offsetWidth;
				tape.classList.add('cf-pop');
				clicks.forEach((t, ti) => t.classList.toggle('is-on', ti === cur));
				show.classList.remove('cf-click-over');
			}, 160);
		};
		const start = () => {
			if (timer || reduce || items.length < 2) return;
			timer = window.setInterval(() => goTo(cur + 1), 3400);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		clicks.forEach((t) =>
			t.addEventListener('click', () => {
				stop();
				goTo(Number(t.dataset.csGo || '0'));
				start();
			})
		);
		show.addEventListener('pointerenter', stop);
		show.addEventListener('pointerleave', start);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.25 }
		);
		io.observe(show);
	}

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
			facts[i]!.classList.remove('is-live');
			i = (n + facts.length) % facts.length;
			facts[i]!.classList.add('is-live');
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
