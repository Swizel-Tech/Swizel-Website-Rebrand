// The engine behind <FilmPlayer>. One control bar, two very different
// sources, so everything below talks to a tiny adapter rather than to a
// <video> or a YouTube player directly. Adding a third source later means
// writing one more adapter, not touching the bar.
import { FILM_DELAY, MUTE_HINT, hintUnmute, startWhenSeen } from './filmAutoplay';

type Adapter = {
	play: () => void;
	pause: () => void;
	seek: (t: number) => void;
	time: () => number;
	duration: () => number;
	buffered: () => number;
	rate: (r: number) => void;
	volume: (v: number) => void;
	muted: (m?: boolean) => boolean;
	playing: () => boolean;
	element: () => HTMLElement | null;
};

let ytReady: Promise<void> | null = null;

// YouTube's API loads once per page, however many films are on it
function loadYouTube(): Promise<void> {
	if (ytReady) return ytReady;
	ytReady = new Promise<void>((resolve, reject) => {
		// proxies and blockers do refuse youtube outright; give up after a
		// few seconds rather than spinning at the visitor forever
		const bail = window.setTimeout(() => reject(new Error('youtube blocked')), 7000);
		const done = () => {
			window.clearTimeout(bail);
			resolve();
		};
		const w = window as any;
		if (w.YT?.Player) return done();
		const prev = w.onYouTubeIframeAPIReady;
		w.onYouTubeIframeAPIReady = () => {
			if (typeof prev === 'function') prev();
			done();
		};
		if (!document.querySelector('script[data-yt-api]')) {
			const s = document.createElement('script');
			s.src = 'https://www.youtube.com/iframe_api';
			s.async = true;
			s.dataset.ytApi = '1';
			s.addEventListener('error', () => {
				window.clearTimeout(bail);
				reject(new Error('youtube blocked'));
			});
			document.head.appendChild(s);
		}
	});
	return ytReady;
}

const clock = (s: number) => {
	if (!Number.isFinite(s) || s < 0) s = 0;
	const m = Math.floor(s / 60);
	const r = Math.floor(s % 60);
	return `${m}:${String(r).padStart(2, '0')}`;
};

export function initFilmPlayers(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>('[data-flm]').forEach((film) => {
		if (film.dataset.flmOn) return;
		film.dataset.flmOn = '1';

		const q = <T extends HTMLElement>(s: string) => film.querySelector<T>(s);
		const bar = q('[data-flm-bar]');
		const playBtn = q<HTMLButtonElement>('[data-flm-play]');
		const bigBtn = q<HTMLButtonElement>('[data-flm-big]');
		const seek = q('[data-flm-seek]');
		const fill = q('[data-flm-fill]');
		const buf = q('[data-flm-buf]');
		const knob = q('[data-flm-knob]');
		const nowEl = q('[data-flm-now]');
		const durEl = q('[data-flm-dur]');
		const rateBtn = q<HTMLButtonElement>('[data-flm-rate]');
		const rateT = q('[data-flm-rate-t]');
		const muteBtn = q<HTMLButtonElement>('[data-flm-mute]');
		const volEl = q<HTMLInputElement>('[data-flm-vol]');
		const fullBtn = q<HTMLButtonElement>('[data-flm-full]');
		const screen = q('[data-flm-screen]');

		const ambient = film.dataset.ambient === '1';

		// ── covering a frame that is not 16/9 ──────────────────────────
		// The smallest 16/9 box that still covers the screen, written out
		// as two custom properties the stylesheet reads. Measured rather
		// than expressed in cq units, which some browsers drop outright.
		if (film.classList.contains('flm--cover') && screen) {
			const fit = () => {
				const r = screen.getBoundingClientRect();
				if (!r.width || !r.height) return;
				const s = Math.max(r.width / 16, r.height / 9);
				screen.style.setProperty('--flm-cw', `${Math.ceil(s * 16)}px`);
				screen.style.setProperty('--flm-ch', `${Math.ceil(s * 9)}px`);
			};
			fit();
			if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screen);
			else window.addEventListener('resize', fit);
		}

		// maxresdefault does not exist for every YouTube video, and a blocked
		// or missing thumbnail would leave a broken image on the glass
		const stillEl = q<HTMLImageElement>('[data-flm-poster]');
		if (stillEl) {
			const nextRung = () => {
				const local = stillEl.dataset.flmPosterFallback;
				if (!stillEl.dataset.fell && stillEl.src.includes('maxresdefault')) {
					stillEl.dataset.fell = '1';
					stillEl.src = stillEl.src.replace('maxresdefault', 'hqdefault');
				} else if (local && stillEl.dataset.fell !== '2') {
					// last rung: a still of our own, so the frame is never empty
					stillEl.dataset.fell = '2';
					stillEl.src = local;
				} else {
					stillEl.remove();
				}
			};
			stillEl.addEventListener('error', nextRung);
			// the thumbnail is in the HTML, so it can fail while the parser
			// is still working and be done failing before this listener
			// exists. An error event does not replay, so catch that case by
			// asking the image how it got on.
			if (stillEl.complete && stillEl.naturalWidth === 0) nextRung();
		}
		const rates = (q('[data-flm-rates]')?.textContent || '1')
			.split(',')
			.map(Number)
			.filter((n) => n > 0);
		let rateIx = Math.max(0, rates.indexOf(1));

		let api: Adapter | null = null;
		let started = false;
		let scrubbing = false;
		let pendingSeek: number | null = null;

		// ── the two adapters ───────────────────────────────────────────
		const nativeAdapter = (v: HTMLVideoElement): Adapter => ({
			play: () => void v.play().catch(() => {}),
			pause: () => v.pause(),
			seek: (t) => {
				v.currentTime = t;
			},
			time: () => v.currentTime,
			duration: () => (Number.isFinite(v.duration) ? v.duration : 0),
			buffered: () => (v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0),
			rate: (r) => {
				v.playbackRate = r;
			},
			volume: (x) => {
				v.volume = x;
			},
			muted: (m) => {
				if (typeof m === 'boolean') v.muted = m;
				return v.muted;
			},
			playing: () => !v.paused && !v.ended,
			element: () => v,
		});

		const ytAdapter = (p: any, host: HTMLElement): Adapter => ({
			play: () => p.playVideo?.(),
			pause: () => p.pauseVideo?.(),
			seek: (t) => p.seekTo?.(t, true),
			time: () => p.getCurrentTime?.() ?? 0,
			duration: () => p.getDuration?.() ?? 0,
			buffered: () => (p.getVideoLoadedFraction?.() ?? 0) * (p.getDuration?.() ?? 0),
			rate: (r) => p.setPlaybackRate?.(r),
			volume: (x) => p.setVolume?.(Math.round(x * 100)),
			muted: (m) => {
				if (typeof m === 'boolean') m ? p.mute?.() : p.unMute?.();
				return !!p.isMuted?.();
			},
			playing: () => p.getPlayerState?.() === 1,
			element: () => host,
		});

		// ── painting ───────────────────────────────────────────────────
		const paint = () => {
			if (!api) return;
			const d = api.duration();
			const t = api.time();
			if (!scrubbing) {
				const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
				if (fill) fill.style.width = pct + '%';
				if (knob) knob.style.left = pct + '%';
				seek?.setAttribute('aria-valuenow', String(Math.round(pct)));
			}
			if (buf && d > 0) buf.style.width = Math.min(100, (api.buffered() / d) * 100) + '%';
			if (nowEl) nowEl.textContent = clock(t);
			if (durEl) durEl.textContent = clock(d);
			film.classList.toggle('is-playing', api.playing());
			film.classList.toggle('is-muted', api.muted());
		};

		let raf = 0;
		const loop = () => {
			paint();
			raf = requestAnimationFrame(loop);
		};
		const runLoop = () => {
			if (!raf) raf = requestAnimationFrame(loop);
		};
		const stopLoop = () => {
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		};

		// ── building the source on first demand ────────────────────────
		const ytId = film.dataset.videoId;

		const build = async (): Promise<Adapter | null> => {
			if (api) return api;
			if (ytId) {
				const host = q('[data-flm-yt]');
				if (!host) return null;
				film.classList.add('is-waiting');
				try {
					await loadYouTube();
				} catch {
					// nothing to play here; hand them the film on YouTube itself
					film.classList.remove('is-waiting');
					film.classList.add('is-blocked');
					if (!q('.flm__blocked')) {
						const a = document.createElement('a');
						a.className = 'flm__blocked';
						a.href = `https://www.youtube.com/watch?v=${ytId}`;
						a.target = '_blank';
						a.rel = 'noopener';
						a.dataset.leaving = 'youtube.com';
						a.dataset.leavingName = 'this film on YouTube';
						a.textContent = 'Watch on YouTube \u2192';
						screen?.appendChild(a);
					}
					ytReady = null; // let a later attempt try again
					return null;
				}
				const mount = document.createElement('div');
				host.appendChild(mount);
				const player = await new Promise<any>((resolve) => {
					const p = new (window as any).YT.Player(mount, {
						videoId: ytId,
						playerVars: {
							controls: 0,
							modestbranding: 1,
							rel: 0,
							playsinline: 1,
							iv_load_policy: 3,
							disablekb: 1,
							// no end-screen grid of other people's videos
							// painted over our own transport
							fs: 0,
							showinfo: 0,
						},
						events: {
							onReady: () => resolve(p),
							onStateChange: (e: { data: number }) => {
								// 1 is PLAYING. If it is running and nobody
								// asked it to, it was a queued call landing
								// late — or YouTube's own chrome. Either way
								// the visitor's last instruction wins.
								if (e?.data === 1 && !want) p.pauseVideo?.();
								paint();
							},
						},
					});
				});
				film.classList.remove('is-waiting');
				api = ytAdapter(player, host);
			} else {
				const v = q<HTMLVideoElement>('[data-flm-vid]');
				if (!v) return null;
				if (v.preload === 'none') v.preload = 'auto';
				api = nativeAdapter(v);
				v.addEventListener('loadedmetadata', paint);
				v.addEventListener('play', paint);
				v.addEventListener('pause', paint);
			}
			if (ambient) api.muted(true);
			api.rate(rates[rateIx] ?? 1);
			if (pendingSeek !== null) {
				api.seek(pendingSeek);
				pendingSeek = null;
			}
			runLoop();
			return api;
		};

		// What the visitor has asked for, as opposed to what the player
		// currently happens to be doing. YouTube's API is asynchronous and
		// queues: a playVideo() issued while the iframe was still coming up
		// can land AFTER a pauseVideo() the visitor pressed a moment later,
		// and the film carries on as though the button did nothing. This is
		// the intent, and onStateChange below re-asserts it.
		let want = false;

		const start = async () => {
			const a = await build();
			if (!a) return;
			started = true;
			want = true;
			film.classList.add('is-started');
			a.play();
			paint();
		};

		const toggle = async () => {
			if (!started) return start();
			if (!api) return;
			if (api.playing()) {
				want = false;
				api.pause();
			} else {
				want = true;
				api.play();
			}
			paint();
		};

		// ── starting on its own ────────────────────────────────────────
		// Muted, because every browser refuses autoplay with sound, and only
		// once the film is actually on screen — a video playing in a pane
		// nobody has scrolled to is wasted bandwidth.
		if (film.dataset.autoplay === '1') {
			// the beat and the hint are shared with every other player on
			// the site — see scripts/filmAutoplay.ts
			startWhenSeen(
				film,
				() => {
					if (started) return;
					void (async () => {
						const a = await build();
						if (!a) return;
						a.muted(true);
						started = true;
						want = true;
						film.classList.add('is-started');
						a.play();
						paint();
						// it is playing and it is silent: say so
						hintUnmute(muteBtn);
					})();
				},
				{ delay: FILM_DELAY, threshold: 0.4 }
			);
		}

		bigBtn?.addEventListener('click', start);
		playBtn?.addEventListener('click', toggle);

		// Tapping the picture toggles, the way a phone player does — but the
		// transport lives INSIDE the screen, so every control was bubbling up
		// to here and getting a second, opposite instruction. Pause paused
		// then immediately played again, and mute did both at once, which is
		// why the sound button looked wired to the pause button.
		screen?.addEventListener('click', (e) => {
			const t = e.target as HTMLElement | null;
			if (t?.closest('[data-flm-big]')) return;
			if (t?.closest('[data-flm-bar]')) return;
			if (started) void toggle();
		});

		film.querySelectorAll<HTMLButtonElement>('[data-flm-skip]').forEach((b) => {
			b.addEventListener('click', async () => {
				const by = Number(b.dataset.flmSkip || 0);
				if (!api) {
					pendingSeek = Math.max(0, by);
					return start();
				}
				const d = api.duration();
				let to = api.time() + by;
				if (to < 0) to = 0;
				if (d > 0 && to > d) to = d;
				api.seek(to);
				paint();
			});
		});

		// ── scrubbing ──────────────────────────────────────────────────
		const ratioAt = (clientX: number) => {
			const r = seek!.getBoundingClientRect();
			return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
		};
		const previewTo = (ratio: number) => {
			if (fill) fill.style.width = ratio * 100 + '%';
			if (knob) knob.style.left = ratio * 100 + '%';
			const d = api?.duration() ?? 0;
			if (nowEl && d > 0) nowEl.textContent = clock(ratio * d);
		};
		if (seek) {
			seek.addEventListener('pointerdown', (e) => {
				scrubbing = true;
				film.classList.add('is-scrubbing');
				seek.setPointerCapture(e.pointerId);
				previewTo(ratioAt(e.clientX));
			});
			seek.addEventListener('pointermove', (e) => {
				if (!scrubbing) return;
				previewTo(ratioAt(e.clientX));
			});
			const drop = async (e: PointerEvent) => {
				if (!scrubbing) return;
				scrubbing = false;
				film.classList.remove('is-scrubbing');
				const r = ratioAt(e.clientX);
				const a = api ?? (await build());
				if (!a) return;
				const d = a.duration();
				if (d > 0) a.seek(r * d);
				else pendingSeek = 0;
				paint();
			};
			seek.addEventListener('pointerup', drop);
			seek.addEventListener('pointercancel', () => {
				scrubbing = false;
				film.classList.remove('is-scrubbing');
			});
			seek.addEventListener('keydown', (e) => {
				if (!api) return;
				const d = api.duration();
				if (!d) return;
				const step = e.shiftKey ? d * 0.1 : 5;
				if (e.key === 'ArrowRight') api.seek(Math.min(d, api.time() + step));
				else if (e.key === 'ArrowLeft') api.seek(Math.max(0, api.time() - step));
				else return;
				e.preventDefault();
				paint();
			});
		}

		// ── speed, sound, full screen ──────────────────────────────────
		rateBtn?.addEventListener('click', () => {
			rateIx = (rateIx + 1) % rates.length;
			const r = rates[rateIx] ?? 1;
			api?.rate(r);
			if (rateT) rateT.textContent = `${r}×`;
		});

		muteBtn?.addEventListener('click', async () => {
			const a = api ?? (await build());
			if (!a) return;
			const next = !a.muted();
			a.muted(next);
			if (!next && volEl && Number(volEl.value) === 0) {
				volEl.value = '70';
				a.volume(0.7);
			}
			paint();
		});

		volEl?.addEventListener('input', async () => {
			const a = api ?? (await build());
			if (!a) return;
			const v = Number(volEl.value) / 100;
			a.volume(v);
			a.muted(v === 0);
			// reaching for the slider is understanding the hint
			muteBtn?.classList.remove(MUTE_HINT);
			paint();
		});

		// ── full screen, and what to do when there is no such thing ──
		//
		// iOS Safari has no Fullscreen API for an ordinary element: only a
		// <video> can go full screen, and a YouTube film here is an iframe.
		// So on an iPhone the full-screen button was calling a method that
		// does not exist and silently doing nothing — which is exactly what
		// the "tap to expand" pill on the phone-sized films was doing too.
		//
		// Cinema mode is the answer for those devices: the player itself is
		// thrown over the viewport, black surround, its own controls at
		// full size, a close button and the escape key. No reparenting, so
		// the iframe is never reloaded and the film does not restart.
		//
		// The catch is that position:fixed is measured against the nearest
		// ancestor carrying a transform, a filter or a backdrop-filter, and
		// the panels these films sit in animate in on a transform that is
		// left behind as matrix(1,0,0,1,0,0) — not "none". So those
		// properties are lifted off the ancestors while cinema is open and
		// put back exactly as they were on the way out.
		const closeBtn = q<HTMLButtonElement>('[data-flm-close]');
		const TRAPPED = 'data-flm-trapped';
		let freed: HTMLElement[] = [];

		const freeAncestors = () => {
			freed = [];
			let n: HTMLElement | null = film.parentElement;
			while (n && n !== document.body && n !== document.documentElement) {
				const c = getComputedStyle(n);
				if (
					c.transform !== 'none' ||
					c.filter !== 'none' ||
					c.backdropFilter !== 'none' ||
					c.perspective !== 'none' ||
					c.contain.includes('paint') ||
					// A stacking context is the other half of the problem: the
					// page body carries `isolation: isolate`, so z-index 9000
					// only ever meant "on top of everything inside the body" —
					// the header sat over the film regardless of the number.
					c.isolation === 'isolate' ||
					c.mixBlendMode !== 'normal' ||
					(c.position !== 'static' && c.zIndex !== 'auto')
				) {
					n.setAttribute(TRAPPED, n.getAttribute('style') ?? '');
					// The transition has to go first. These panels carry
					// `transition: transform .7s`, so simply writing "none"
					// starts a seven-hundred-millisecond animation towards it
					// — and every frame of that animation is still a computed
					// transform, which still traps the fixed player. The film
					// would sit in its little box for most of a second and
					// then jump out. Killing the transition makes it instant.
					n.style.transition = 'none';
					n.style.transform = 'none';
					n.style.filter = 'none';
					n.style.backdropFilter = 'none';
					n.style.perspective = 'none';
					n.style.contain = 'none';
					n.style.isolation = 'auto';
					n.style.mixBlendMode = 'normal';
					n.style.zIndex = 'auto';
					freed.push(n);
				}
				n = n.parentElement;
			}
		};
		const restoreAncestors = () => {
			freed.forEach((n) => {
				const was = n.getAttribute(TRAPPED) ?? '';
				n.removeAttribute(TRAPPED);
				if (was) n.setAttribute('style', was);
				else n.removeAttribute('style');
			});
			freed = [];
		};

		const inCinema = () => film.classList.contains('is-cinema');
		const cinema = (on: boolean) => {
			if (on === inCinema()) return;
			if (on) {
				freeAncestors();
				film.classList.add('is-cinema');
				document.documentElement.classList.add('flm-cinema');
				closeBtn?.removeAttribute('hidden');
			} else {
				film.classList.remove('is-cinema');
				document.documentElement.classList.remove('flm-cinema');
				closeBtn?.setAttribute('hidden', '');
				restoreAncestors();
			}
			// the cover fit is measured, so it has to be measured again
			window.dispatchEvent(new Event('resize'));
		};

		fullBtn?.addEventListener('click', () => {
			const target = (screen as HTMLElement) || film;
			if (inCinema()) return cinema(false);
			if (document.fullscreenElement) return void document.exitFullscreen();
			// Only ask for real full screen where the browser says it will
			// give it; otherwise the promise rejects (or the method is
			// simply absent) and the button appears broken.
			if (document.fullscreenEnabled && typeof target.requestFullscreen === 'function') {
				void target.requestFullscreen().catch(() => cinema(true));
			} else {
				cinema(true);
			}
		});
		closeBtn?.addEventListener('click', () => cinema(false));
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && inCinema()) cinema(false);
		});

		// nothing plays off-screen, and nothing burns a frame loop there
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(entries) => {
					const e = entries[0];
					if (!e) return;
					if (e.isIntersecting) {
						if (started) runLoop();
					} else {
						stopLoop();
						if (api?.playing()) {
							want = false;
							api.pause();
						}
						paint();
					}
				},
				{ threshold: 0.25 }
			).observe(film);
		}
		document.addEventListener('visibilitychange', () => {
			if (document.hidden && api?.playing()) {
				api.pause();
				paint();
			}
		});

		paint();
	});
}
