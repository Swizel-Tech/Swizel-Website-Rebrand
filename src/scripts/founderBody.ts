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

	// ── every rail marked [data-drift] creeps on its own ──
	// A phone gives no clue that a row slides sideways, so each one drifts
	// back and forth until the reader takes it over. Queried off the
	// document, not the body, so the hero's rails are covered too.
	document.querySelectorAll<HTMLElement>('[data-drift]').forEach((rail) => {
		if (reduce || rail.dataset.driftBound === '1') return;
		rail.dataset.driftBound = '1';
		let dir: 1 | -1 = 1;
		let seen = false;
		let resumeAt = 0;
		const park = (ms = 2600) => (resumeAt = performance.now() + ms);
		rail.addEventListener('pointerenter', () => park(14000));
		rail.addEventListener('pointerleave', () => park(600));
		rail.addEventListener('touchstart', () => park(4000), { passive: true });
		rail.addEventListener('wheel', () => park(), { passive: true });
		rail.addEventListener('focusin', () => park(6000));
		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => entries.forEach((e) => (seen = e.isIntersecting)),
				{ threshold: 0.25 }
			);
			io.observe(rail);
		} else {
			seen = true;
		}
		window.setInterval(() => {
			if (!seen || document.hidden || performance.now() < resumeAt) return;
			const max = rail.scrollWidth - rail.clientWidth;
			if (max <= 12) return; // it fits on this screen; nothing to show
			if (rail.scrollLeft >= max - 1) dir = -1;
			else if (rail.scrollLeft <= 1) dir = 1;
			rail.scrollBy({ left: dir * 0.7, behavior: 'auto' });
		}, 32);
	});

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

			// ten seconds either way, wrapped so the ends never dead-end
			spot.querySelectorAll<HTMLButtonElement>('[data-spot-skip]').forEach((s) => {
				s.addEventListener('click', () => {
					const by = Number(s.dataset.spotSkip || '0');
					const len = vid.duration;
					if (!Number.isFinite(len) || len <= 0) return;
					let at = vid.currentTime + by;
					if (at < 0) at += len;
					if (at > len) at -= len;
					vid.currentTime = at;
				});
			});

			// hold it, or let it run
			const play = spot.querySelector<HTMLButtonElement>('[data-spot-play]');
			const paintPlay = () => {
				const held = vid.paused;
				reel?.classList.toggle('is-held', held);
				play?.setAttribute('aria-label', held ? 'Play the film' : 'Pause the film');
			};
			play?.addEventListener('click', () => {
				// a deliberate pause outranks the observer that started it
				if (vid.paused) void vid.play().catch(() => {});
				else vid.pause();
			});
			vid.addEventListener('play', paintPlay);
			vid.addEventListener('pause', paintPlay);
			paintPlay();
		}

		// the print wall: grab it, flick it, or use the arrows. The wrapper
		// only wears its controls once there is actually somewhere to go.
		const rail = spot.querySelector<HTMLElement>('[data-spot-rail]');
		const railWrap = rail?.closest<HTMLElement>('.spot__railwrap');
		if (rail && railWrap) {
			const overflows = () => rail.scrollWidth > rail.clientWidth + 4;
			const paintNav = () => railWrap.classList.toggle('can-scroll', overflows());
			const stepBy = () => {
				const shot = rail.querySelector<HTMLElement>('.spot__shot');
				return shot ? shot.offsetWidth + 24 : rail.clientWidth * 0.7;
			};
			const nudge = (dir: 1 | -1) =>
				rail.scrollBy({ left: dir * stepBy(), behavior: reduce ? 'auto' : 'smooth' });
			spot
				.querySelector<HTMLButtonElement>('[data-spot-rail-prev]')
				?.addEventListener('click', () => nudge(-1));
			spot
				.querySelector<HTMLButtonElement>('[data-spot-rail-next]')
				?.addEventListener('click', () => nudge(1));

			// drag with a mouse, the way you would flick it on glass
			let down = false;
			let startX = 0;
			let startLeft = 0;
			let moved = 0;
			rail.addEventListener('pointerdown', (e) => {
				if (e.pointerType === 'touch' || !overflows()) return;
				down = true;
				moved = 0;
				startX = e.clientX;
				startLeft = rail.scrollLeft;
				rail.classList.add('is-dragging');
			});
			rail.addEventListener('pointermove', (e) => {
				if (!down) return;
				const dx = e.clientX - startX;
				moved = Math.abs(dx);
				rail.scrollLeft = startLeft - dx;
			});
			const stop = () => {
				if (!down) return;
				down = false;
				rail.classList.remove('is-dragging');
			};
			rail.addEventListener('pointerup', stop);
			rail.addEventListener('pointercancel', stop);
			rail.addEventListener('pointerleave', stop);
			rail.addEventListener(
				'click',
				(e) => {
					if (moved > 6) {
						e.preventDefault();
						e.stopPropagation();
						moved = 0;
					}
				},
				true
			);

			rail.addEventListener('scroll', paintNav, { passive: true });
			window.addEventListener('resize', paintNav);
			paintNav();
			// the photographs load lazily, so the width settles a beat later
			window.setTimeout(paintNav, 900);
		}
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

	// ── the receipts wall drifts on its own wherever it is a rail ──
	// Same manners as everything else that moves on this site: it parks
	// the moment you touch it, and only takes the wheel back once you
	// have let go. On desktop the wall is a grid, so this does nothing.
	const wall = document.querySelector<HTMLElement>('.fd-wall');
	if (wall && !reduce) {
		let dir: 1 | -1 = 1;
		let paused = false;
		let seen = false;
		let resumeAt = 0;
		const park = (ms = 2600) => {
			resumeAt = performance.now() + ms;
		};
		wall.addEventListener('pointerenter', () => (paused = true));
		wall.addEventListener('pointerleave', () => {
			paused = false;
			park(600);
		});
		wall.addEventListener('touchstart', () => park(4000), { passive: true });
		wall.addEventListener('wheel', () => park(), { passive: true });
		wall.addEventListener('focusin', () => park(6000));
		const wio = new IntersectionObserver(
			(entries) => entries.forEach((e) => (seen = e.isIntersecting)),
			{ threshold: 0.2 }
		);
		wio.observe(wall);
		window.setInterval(() => {
			if (paused || !seen || document.hidden) return;
			if (performance.now() < resumeAt) return;
			const max = wall.scrollWidth - wall.clientWidth;
			if (max <= 24) return; // it is a grid at this width, or a hairline
			if (wall.scrollLeft >= max - 1) dir = -1;
			else if (wall.scrollLeft <= 1) dir = 1;
			wall.scrollBy({ left: dir * 0.7, behavior: 'auto' });
		}, 32);
	}
}
