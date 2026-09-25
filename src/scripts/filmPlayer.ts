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
						},
						events: {
							onReady: () => resolve(p),
							onStateChange: () => paint(),
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

		const start = async () => {
			const a = await build();
			if (!a) return;
			started = true;
			film.classList.add('is-started');
			a.play();
			paint();
		};

		const toggle = async () => {
			if (!started) return start();
			if (!api) return;
			api.playing() ? api.pause() : api.play();
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

		fullBtn?.addEventListener('click', () => {
			const target = (screen as HTMLElement) || film;
			if (document.fullscreenElement) void document.exitFullscreen();
			else void target.requestFullscreen?.().catch(() => {});
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
						if (api?.playing()) api.pause();
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
