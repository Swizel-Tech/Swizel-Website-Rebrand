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
			if (reduce) {
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
				await sleep(incoming ? 480 : 700);
			}
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
}
