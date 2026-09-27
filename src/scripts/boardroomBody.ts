export function initBoardroomBody() {
	const body = document.querySelector('.bdbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// calm scroll reveals — threshold 0 (not 0.18) so elements TALLER than the
	// viewport (e.g. a full blog article body) still reveal; 18% of a long
	// article is never on screen at once, which used to leave the body stuck at
	// opacity:0. rootMargin trims a little off the bottom so it eases in.
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
			{ threshold: 0, rootMargin: '0px 0px -8% 0px' }
		);
		reveals.forEach((r) => {
			// anything already in (or above) the viewport on load reveals at once
			if (r.getBoundingClientRect().top < window.innerHeight * 0.92) {
				r.classList.add('is-on');
			} else {
				io.observe(r);
			}
		});
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
			const cur = quotes[i]!;
			i = (i + 1) % quotes.length;
			const nxt = quotes[i]!;
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

	// A remote still that will not load must not leave a black card: each
	// one may name a local frame to fall back to.
	body.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach((img) => {
		const drop = () => {
			const next = img.dataset.fallback;
			if (!next || img.src.endsWith(next)) return;
			img.src = next;
			delete img.dataset.fallback;
		};
		img.addEventListener('error', drop);
		// a host that is unreachable rather than refusing hangs instead of
		// erroring, and the card would sit black for as long as it took, so
		// the still is given a deadline as well as an error handler
		window.setTimeout(() => {
			if (!img.complete || img.naturalWidth === 0) drop();
		}, 3500);
	});

	// ── the numbers band ──
	// The lines are drawn, the bars filled and the sweep started only once
	// the band is actually on screen, so a visitor never scrolls down to
	// find the drawing already over.
	const band = document.getElementById('bd-numbers');
	if (band) {
		if (reduce || !('IntersectionObserver' in window)) {
			band.classList.add('is-on');
		} else {
			const io = new IntersectionObserver(
				(entries) => {
					if (!entries[0]?.isIntersecting) return;
					band.classList.add('is-on');
					io.disconnect();
				},
				{ threshold: 0.25 }
			);
			io.observe(band);
		}
	}

	// ── the pull switch on the process card ──
	// The whole sequence is CSS; all script does is decide when it starts,
	// and only once. It waits for the card to be properly on screen rather
	// than firing at the first pixel, so the hand is never already gone by
	// the time the visitor is looking at it.
	const life = body.querySelector<HTMLElement>('[data-bd-life]');
	if (life) {
		if (reduce) {
			life.classList.add('is-lit');
		} else if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => {
					if (!entries[0]?.isIntersecting) return;
					life.classList.add('is-lit');
					io.disconnect();
				},
				{ threshold: 0.35 }
			);
			io.observe(life);
		} else {
			life.classList.add('is-lit');
		}
	}

	// the discipline card's film runs only while the card is on screen —
	// autoplay on a muted, controlless <video> is allowed, but a reel
	// decoding behind the fold is work nobody asked for
	body.querySelectorAll<HTMLVideoElement>('.bd-tile--svc video').forEach((film) => {
		film.muted = true;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) void film.play().catch(() => {});
				else film.pause();
			},
			{ threshold: 0.2 }
		);
		io.observe(film);
	});

	// team profile modal (About page)
	const modal = document.getElementById('bd-member-modal');
	if (modal) {
		const photo = modal.querySelector<HTMLImageElement>('#bd-modal-photo');
		const nameEl = modal.querySelector('#bd-modal-name');
		const roleEl = modal.querySelector('#bd-modal-role');
		const bioEl = modal.querySelector('#bd-modal-bio');
		const linkedinEl = modal.querySelector<HTMLAnchorElement>('#bd-modal-linkedin');
		const expWrap = modal.querySelector<HTMLElement>('#bd-modal-exp-wrap');
		const expList = modal.querySelector('#bd-modal-exp');
		let lastFocused: HTMLElement | null = null;

		const open = (btn: HTMLElement) => {
			const name = btn.getAttribute('data-name') || '';
			const role = btn.getAttribute('data-role') || '';
			const bio = btn.getAttribute('data-bio') || '';
			const linkedin = btn.getAttribute('data-linkedin') || '';
			let exp: { company: string; jobDesc: string }[] = [];
			try {
				exp = JSON.parse(btn.getAttribute('data-exp') || '[]');
			} catch (e) {}
			if (photo) {
				photo.src = `/teammates/${name}.jpg`;
				photo.alt = name;
			}
			if (nameEl) nameEl.textContent = name;
			if (roleEl) roleEl.textContent = role;
			if (bioEl) bioEl.textContent = bio;
			if (linkedinEl) {
				if (linkedin) {
					linkedinEl.href = linkedin;
					linkedinEl.dataset.leavingName = `${name} on LinkedIn`;
					linkedinEl.hidden = false;
				} else {
					linkedinEl.hidden = true;
				}
			}
			if (expList && expWrap) {
				expList.innerHTML = '';
				if (exp.length) {
					exp.forEach((e) => {
						const li = document.createElement('li');
						const s = document.createElement('strong');
						s.textContent = e.company;
						const sp = document.createElement('span');
						sp.textContent = e.jobDesc;
						li.appendChild(s);
						li.appendChild(sp);
						expList.appendChild(li);
					});
					expWrap.hidden = false;
				} else {
					expWrap.hidden = true;
				}
			}
			lastFocused = document.activeElement as HTMLElement;
			modal.hidden = false;
			void (modal as HTMLElement).offsetWidth; // reflow for transition
			modal.classList.add('is-open');
			document.body.style.overflow = 'hidden';
			modal.querySelector<HTMLElement>('.bd-modal-x')?.focus();
		};
		const close = () => {
			modal.classList.remove('is-open');
			document.body.style.overflow = '';
			window.setTimeout(() => {
				modal.hidden = true;
			}, 300);
			lastFocused?.focus();
		};

		body.querySelectorAll<HTMLElement>('[data-member]').forEach((btn) => {
			btn.addEventListener('click', () => open(btn));
		});
		modal.querySelectorAll('[data-modal-close]').forEach((el) =>
			el.addEventListener('click', close)
		);
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !modal.hidden) close();
		});
	}
}
