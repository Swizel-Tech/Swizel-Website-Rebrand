// "Swizel for business" — the reel of films and the belt of work.
//
// The reel is a native scroller with centre snapping rather than a
// transformed track, so a phone gets its own momentum and its own snap for
// free and the geometry is identical on every screen: one card in the
// middle, its neighbours held back at either edge.
//
// It walks on by itself. Rest a pointer on a card and it stops there and
// plays that one instead; press a card and the sound comes on and the walk
// ends, because at that point the visitor has chosen something to watch.
//
// Only the live card carries a player. The rest are their own posters
// until the first time they come to the middle, so a row of four films
// costs one iframe on arrival, not four.
import { loadApi } from './whiteboardVideo';
import { hintUnmute } from './filmAutoplay';

interface Film {
	playVideo(): void;
	pauseVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	getPlayerState(): number;
	mute(): void;
	unMute(): void;
	destroy(): void;
}

const STEP = 7600; // how long a card holds the middle before the walk moves on

export function initBusinessReel() {
	const reel = document.querySelector<HTMLElement>('[data-bz-reel]');
	if (!reel || reel.dataset.bzReady === '1') return;
	reel.dataset.bzReady = '1';

	const track = reel.querySelector<HTMLElement>('[data-bz-track]');
	const slides = Array.from(reel.querySelectorAll<HTMLElement>('[data-bz-slide]'));
	// the pager sits under the belt, outside the reel, exactly as it does
	// on the reference — so it is looked up from the section, not the reel
	const chapter = reel.closest('section') ?? document;
	const pips = Array.from(chapter.querySelectorAll<HTMLButtonElement>('[data-bz-dot]'));
	if (!track || !slides.length) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const films: (Film | null)[] = slides.map(() => null);
	const loud: boolean[] = slides.map(() => false);
	// the markup decides which card opens in the middle
	let live = Math.max(0, slides.findIndex((s) => s.classList.contains('is-live')));
	let walking = false;
	let held = false; // a pointer is resting on the reel
	let chosen = false; // the visitor picked a card; the walk is over
	let timer = 0;

	// ── posters ──
	// maxres does not exist for every upload, so a miss drops to hq rather
	// than leaving a black rectangle where the still should be.
	reel.querySelectorAll<HTMLImageElement>('.bz-poster').forEach((img) => {
		img.addEventListener('error', () => {
			const next = img.dataset.bzFallback;
			if (next && img.src !== next) {
				img.src = next;
				delete img.dataset.bzFallback;
			}
		});
	});

	// ── where a slide sits inside the scroller ──
	// offsetLeft is measured against offsetParent, which is not necessarily
	// the track, so the position is taken from the two rectangles and the
	// scroll that is already applied.
	const centreOf = (el: HTMLElement) => {
		const a = el.getBoundingClientRect();
		const b = track.getBoundingClientRect();
		return a.left - b.left + track.scrollLeft + a.width / 2 - track.clientWidth / 2;
	};

	// Centring moves the row under the pointer, so whatever card was being
	// hovered slides away and a different one arrives beneath a hand that
	// never moved. Without this lock that counts as a fresh hover and the
	// reel walks itself along the row, one cascade per card.
	let hoverLock = 0;
	const centre = (i: number, smooth = true) => {
		const el = slides[i];
		if (!el) return;
		hoverLock = Date.now() + 800;
		track.scrollTo({ left: centreOf(el), behavior: smooth && !reduce ? 'smooth' : 'auto' });
	};

	// ── the player on the live card ──
	const mount = async (i: number) => {
		if (films[i]) return films[i];
		const host = slides[i]?.querySelector<HTMLElement>('[data-bz-yt]');
		const id = host?.dataset.bzYt;
		if (!host || !id) return null;
		const YT = await loadApi().catch(() => null);
		if (!YT?.Player) return null;
		if (films[i]) return films[i]; // a second call landed while the API loaded
		const seat = document.createElement('div');
		host.appendChild(seat);
		films[i] = new YT.Player(seat, {
			videoId: id,
			playerVars: {
				autoplay: 1,
				mute: 1,
				loop: 1,
				playlist: id, // the only way a single video loops
				controls: 0,
				modestbranding: 1,
				rel: 0,
				playsinline: 1,
				iv_load_policy: 3,
				disablekb: 1,
				fs: 0,
			},
			events: {
				onReady: () => {
					films[i]?.mute();
					if (live === i) {
						films[i]?.playVideo();
						slides[i]?.classList.add('is-playing');
					} else {
						films[i]?.pauseVideo();
					}
				},
				onStateChange: (e: { data: number }) => {
					// 0 ENDED · 1 PLAYING · 2 PAUSED. A card in the middle is
					// never allowed to stop: an ended film shows YouTube's end
					// card and a paused one its big centre button, and either
					// puts someone else's furniture on our picture.
					if (e?.data === 0) {
						films[i]?.seekTo(0, true);
						if (live === i) films[i]?.playVideo();
					} else if (e?.data === 2 && live === i) {
						films[i]?.playVideo();
					} else if (e?.data === 1 && live !== i) {
						films[i]?.pauseVideo();
					}
					slides[i]?.classList.toggle('is-playing', e?.data === 1);
				},
			},
		}) as unknown as Film;
		return films[i];
	};

	const setLive = (i: number, opts: { scroll?: boolean } = {}) => {
		const next = ((i % slides.length) + slides.length) % slides.length;
		const changed = next !== live;
		live = next;

		slides.forEach((s, si) => {
			s.classList.toggle('is-live', si === live);
			if (si !== live) {
				s.classList.remove('is-playing', 'is-loud');
				loud[si] = false;
				films[si]?.pauseVideo();
				films[si]?.mute();
			}
		});
		pips.forEach((p, pi) => {
			p.classList.toggle('is-on', pi === live);
			p.setAttribute('aria-selected', String(pi === live));
		});

		if (opts.scroll) centre(live);
		if (!walking) return;

		const cur = films[live];
		if (cur) {
			cur.playVideo();
		} else if (changed || !films[live]) {
			void mount(live);
		}
	};

	// ── the walk ──
	const stepOn = () => {
		if (held || chosen || document.hidden) return;
		setLive(live + 1, { scroll: true });
	};
	const startWalk = () => {
		if (timer || chosen || reduce) return;
		timer = window.setInterval(stepOn, STEP);
	};
	const stopWalk = () => {
		window.clearInterval(timer);
		timer = 0;
	};

	// ── the visitor's hands ──
	slides.forEach((s, i) => {
		// a pointer resting on a card takes it as the choice of card,
		// without ending the walk — lifting the pointer lets it carry on
		s.addEventListener('pointerenter', (e) => {
			if ((e as PointerEvent).pointerType === 'touch') return;
			held = true;
			if (Date.now() < hoverLock) return;
			if (i !== live) setLive(i, { scroll: true });
		});
		s.querySelector<HTMLButtonElement>('[data-bz-pick]')?.addEventListener('click', () => {
			// pressing a card is a decision: it stops walking and it speaks
			chosen = true;
			stopWalk();
			if (i !== live) {
				setLive(i, { scroll: true });
			}
			const f = films[i];
			if (f) {
				f.unMute();
				loud[i] = true;
				slides[i]?.classList.add('is-loud');
				f.playVideo();
			}
			const snd = slides[i]?.querySelector<HTMLButtonElement>('[data-bz-sound]');
			snd?.setAttribute('aria-pressed', 'false');
		});
		s.querySelector<HTMLButtonElement>('[data-bz-sound]')?.addEventListener('click', (e) => {
			e.stopPropagation();
			const f = films[i];
			if (!f) return;
			loud[i] = !loud[i];
			loud[i] ? f.unMute() : f.mute();
			s.classList.toggle('is-loud', loud[i]);
			const btn = e.currentTarget as HTMLButtonElement;
			btn.setAttribute('aria-pressed', String(!loud[i]));
			btn.setAttribute('aria-label', `${loud[i] ? 'Mute' : 'Unmute'}: ${s.querySelector('.bz-title')?.textContent ?? 'the film'}`);
			if (loud[i]) {
				chosen = true;
				stopWalk();
			}
		});
	});
	reel.addEventListener('pointerleave', () => {
		held = false;
	});

	pips.forEach((p, i) =>
		p.addEventListener('click', () => {
			chosen = true;
			stopWalk();
			setLive(i, { scroll: true });
		})
	);

	// a drag or a flick is the visitor steering, so the card nearest the
	// middle becomes the live one — without being scrolled again underneath
	// them, which is what makes a snapping carousel feel like it is fighting
	let settle = 0;
	let reflow = 0;
	track.addEventListener(
		'scroll',
		() => {
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				let best = 0;
				let near = Infinity;
				slides.forEach((s, i) => {
					const d = Math.abs(centreOf(s) - track.scrollLeft);
					if (d < near) {
						near = d;
						best = i;
					}
				});
				if (best !== live) setLive(best);
			}, 140);
		},
		{ passive: true }
	);

	// put the opening card in the middle without a visible slide
	centre(live, false);
	window.addEventListener('resize', () => {
		window.clearTimeout(reflow);
		reflow = window.setTimeout(() => centre(live, false), 160);
	});

	// ── nothing runs while nobody is looking ──
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				const en = entries[0];
				if (!en) return;
				if (en.isIntersecting) {
					if (!walking) {
						walking = true;
						void mount(live).then((f) => {
							if (!f) return;
							f.playVideo();
							const snd = slides[live]?.querySelector<HTMLButtonElement>('[data-bz-sound]');
							// it is playing and it is silent: say so, the same way
							// every other film on the site does
							if (snd) hintUnmute(snd);
						});
					}
					startWalk();
				} else {
					stopWalk();
					films.forEach((f) => f?.pauseVideo());
					slides.forEach((s) => s.classList.remove('is-playing'));
				}
			},
			{ threshold: 0.25 }
		);
		io.observe(reel);
	}
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			stopWalk();
			films.forEach((f) => f?.pauseVideo());
		} else if (walking) {
			startWalk();
			films[live]?.playVideo();
		}
	});

	// ── the belt ──
	// The track carries the list twice and walks exactly half its own
	// width, so the seam never shows. The only thing script does here is
	// let a touch pause it, since there is no hover to do the job.
	const belt = document.querySelector<HTMLElement>('[data-bz-belt-track]');
	if (belt) {
		let restore = 0;
		belt.addEventListener(
			'touchstart',
			() => {
				belt.style.animationPlayState = 'paused';
				window.clearTimeout(restore);
				restore = window.setTimeout(() => {
					belt.style.animationPlayState = '';
				}, 2600);
			},
			{ passive: true }
		);
	}
}
