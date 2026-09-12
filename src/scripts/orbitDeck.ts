// The hand on the wheel.
//
// Turns the orbit deck one spoke at a time, draws the countdown arc round
// the rim, and gets out of the way the moment somebody takes hold of it.

export function initOrbitDeck() {
	const wheels = Array.from(document.querySelectorAll<HTMLElement>('[data-orbit]'));
	if (!wheels.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	wheels.forEach((wheel) => {
		if (wheel.dataset.orbBound === '1') return;
		wheel.dataset.orbBound = '1';

		const spokes = Array.from(wheel.querySelectorAll<HTMLElement>('[data-orb-spoke]'));
		const panels = Array.from(wheel.querySelectorAll<HTMLElement>('[data-orb-panel]'));
		if (spokes.length < 2 || panels.length !== spokes.length) return;
		const ring = wheel.querySelector<SVGCircleElement>('[data-orb-ring]');
		const total = spokes.length;
		const every = Math.max(0, Number(wheel.dataset.every || '6')) * 1000;
		const LEN = 578;

		let at = 0;
		let seen = false;
		let resumeAt = 0;
		let last = performance.now();

		const paint = () => {
			spokes.forEach((s, i) => s.setAttribute('aria-pressed', i === at ? 'true' : 'false'));
			panels.forEach((p, i) => {
				p.classList.toggle('is-on', i === at);
				p.setAttribute('aria-hidden', i === at ? 'false' : 'true');
			});
		};

		const park = (ms = 9000) => {
			resumeAt = performance.now() + ms;
		};

		const go = (dir: 1 | -1) => {
			at = (at + dir + total) % total;
			last = performance.now();
			paint();
		};

		const jump = (n: number) => {
			at = n;
			last = performance.now();
			paint();
		};

		spokes.forEach((s, i) =>
			s.addEventListener('click', () => {
				park();
				jump(i);
			})
		);
		wheel.querySelector<HTMLButtonElement>('[data-orb-prev]')?.addEventListener('click', () => {
			park();
			go(-1);
		});
		wheel.querySelector<HTMLButtonElement>('[data-orb-next]')?.addEventListener('click', () => {
			park();
			go(1);
		});

		wheel.addEventListener('pointerenter', () => park(14000));
		wheel.addEventListener('pointerleave', () => park(1200));
		wheel.addEventListener('touchstart', () => park(12000), { passive: true });

		// flick the wheel sideways on glass
		let x0 = 0;
		wheel.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
		wheel.addEventListener(
			'touchend',
			(e) => {
				const dx = e.changedTouches[0].clientX - x0;
				if (Math.abs(dx) > 48) {
					park();
					go(dx < 0 ? 1 : -1);
				}
			},
			{ passive: true }
		);

		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => entries.forEach((en) => (seen = en.isIntersecting)),
				{ threshold: 0.3 }
			);
			io.observe(wheel);
		} else {
			seen = true;
		}

		if (every > 0 && !reduce) {
			window.setInterval(() => {
				if (!seen || document.hidden) {
					last = performance.now();
					return;
				}
				const waiting = performance.now() < resumeAt;
				wheel.classList.toggle('is-held', waiting);
				if (waiting) {
					last = performance.now();
				} else if (performance.now() - last >= every) {
					go(1);
				}
				if (ring) {
					const p = waiting ? 0 : Math.min((performance.now() - last) / every, 1);
					ring.style.strokeDashoffset = String(LEN * (1 - p));
				}
			}, 120);
		} else if (ring) {
			ring.style.strokeDashoffset = String(LEN);
		}

		paint();
	});
}

/**
 * Small inline films that live inside a section rather than a player:
 * they start when they reach the screen, stop when they leave, and hold
 * when you ask them to.
 */
export function initInlineFilms() {
	document.querySelectorAll<HTMLElement>('[data-fs-film]').forEach((film) => {
		if (film.dataset.filmBound === '1') return;
		film.dataset.filmBound = '1';
		const vid = film.querySelector<HTMLVideoElement>('video');
		if (!vid) return;
		let held = false;

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting && !held) {
						if (vid.preload === 'none') vid.preload = 'auto';
						void vid.play().catch(() => {});
					} else if (!vid.paused) {
						vid.pause();
					}
				});
			},
			{ threshold: 0.3 }
		);
		io.observe(vid);

		film.querySelector<HTMLButtonElement>('[data-fs-film-play]')?.addEventListener('click', () => {
			held = !vid.paused;
			if (held) vid.pause();
			else void vid.play().catch(() => {});
		});
		const paint = () => film.classList.toggle('is-held', vid.paused);
		vid.addEventListener('play', paint);
		vid.addEventListener('pause', paint);
		paint();
	});
}
