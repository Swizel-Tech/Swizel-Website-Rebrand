// Founder world: scroll reveals, momentum counters, the sprint track fill,
// the traction curve draw, and the founders group-chat sequence.
export function initFounderBody() {
	const body = document.querySelector('.fbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── scroll reveals ──
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.fd-rev'));
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
			// respect data-decimals so 99.9% doesn't round up to 100%
			const dec = Number(el.dataset.decimals || '0');
			if (reduce) {
				el.textContent = t.toFixed(dec) + sfx;
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / 1200, 1);
				el.textContent =
					((1 - Math.pow(1 - p, 3)) * t).toFixed(dec) + sfx;
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

	// ── the sprint track fills when it enters view ──
	const track = body.querySelector<HTMLElement>('#fd-track');
	if (track) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.35 }
		);
		io.observe(track);
	}

	// ── the traction curve draws itself ──
	const chart = body.querySelector<HTMLElement>('#fd-chart');
	if (chart) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-draw');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.45 }
		);
		io.observe(chart);
	}

	// ── the group chat plays out like a real thread ──
	const phone = body.querySelector<HTMLElement>('#fd-chat');
	if (phone) {
		const msgs = Array.from(phone.querySelectorAll<HTMLElement>('.fd-msg'));
		const typing = phone.querySelector<HTMLElement>('#fd-typing');
		let played = false;

		const body = phone.querySelector<HTMLElement>('.fd-phone-body');
		/* keep the newest message in view as the thread plays out — and once
		   it has finished, let it drift on by itself so the section is never
		   a dead wall of text on a phone */
		const follow = (el: HTMLElement) => {
			if (!body) return;
			const target = el.offsetTop - body.clientHeight + el.offsetHeight + 28;
			body.scrollTo({ top: Math.max(target, 0), behavior: reduce ? 'auto' : 'smooth' });
		};

		const idle = () => {
			if (!body) return;
			let dir = 1;
			let paused = false;
			body.addEventListener('pointerenter', () => (paused = true));
			body.addEventListener('pointerleave', () => (paused = false));
			body.addEventListener('touchstart', () => (paused = true), { passive: true });
			window.setInterval(() => {
				if (paused || reduce) return;
				const max = body.scrollHeight - body.clientHeight;
				if (max <= 4) return;
				if (body.scrollTop >= max - 2) dir = -1;
				else if (body.scrollTop <= 2) dir = 1;
				body.scrollBy({ top: dir * 0.7, behavior: 'auto' });
			}, 40);
		};

		const play = async () => {
			if (played) return;
			played = true;
			if (reduce) {
				msgs.forEach((m) => m.classList.add('is-in'));
				return;
			}
			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			for (const m of msgs) {
				const incoming = m.classList.contains('fd-msg--them');
				if (incoming && typing) {
					// the dots appear right before each founder message
					m.parentElement?.insertBefore(typing, m);
					typing.classList.add('is-on');
					await sleep(750);
					typing.classList.remove('is-on');
				}
				m.classList.add('is-in');
				follow(m);
				await sleep(incoming ? 620 : 820);
			}
			// the thread has played; now it drifts
			window.setTimeout(idle, 1200);
		};

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						play();
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.35 }
		);
		io.observe(phone);
	}

	// ── the spotlight: her cut, and the wall that drifts ──
	const spot = document.querySelector<HTMLElement>('#fd-spotlight');
	if (spot) {
		// the reel only starts once it is actually on screen
		const reel = spot.querySelector<HTMLElement>('[data-spot-reel]');
		const vid = reel?.querySelector<HTMLVideoElement>('video');
		if (vid) {
			const vio = new IntersectionObserver(
				(entries) => {
					entries.forEach((e) => {
						if (e.isIntersecting) {
							if (vid.preload === 'none') vid.preload = 'auto';
							void vid.play().catch(() => {});
						} else if (!vid.paused) {
							vid.pause();
						}
					});
				},
				{ threshold: 0.3 }
			);
			vio.observe(vid);

			const btn = spot.querySelector<HTMLButtonElement>('[data-spot-sound]');
			const btnT = spot.querySelector<HTMLElement>('[data-spot-sound-t]');
			btn?.addEventListener('click', () => {
				vid.muted = !vid.muted;
				const loud = !vid.muted;
				reel?.classList.toggle('is-loud', loud);
				btn.setAttribute('aria-pressed', loud ? 'true' : 'false');
				if (btnT) btnT.textContent = loud ? 'Sound on' : 'Tap for sound';
				if (loud) void vid.play().catch(() => {});
			});
		}

		// the print wall drifts on its own where it is a rail (phones)
		const rail = spot.querySelector<HTMLElement>('[data-spot-rail]');
		if (rail && !reduce) {
			let dir = 1;
			let paused = false;
			let seen = false;
			rail.addEventListener('pointerenter', () => (paused = true));
			rail.addEventListener('pointerleave', () => (paused = false));
			rail.addEventListener('touchstart', () => (paused = true), { passive: true });
			const rio = new IntersectionObserver(
				(entries) => entries.forEach((e) => (seen = e.isIntersecting)),
				{ threshold: 0.2 }
			);
			rio.observe(rail);
			window.setInterval(() => {
				if (paused || !seen) return;
				const max = rail.scrollWidth - rail.clientWidth;
				if (max <= 4) return;
				if (rail.scrollLeft >= max - 1) dir = -1;
				else if (rail.scrollLeft <= 1) dir = 1;
				rail.scrollBy({ left: dir * 0.75, behavior: 'auto' });
			}, 32);
		}
	}
}
