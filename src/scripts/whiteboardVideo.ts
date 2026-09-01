// The whiteboard player.
//
// YouTube gives us the pixels; every control belongs to the board. The
// embed runs with controls:0 / rel:0 / modestbranding:1, nothing loads
// until somebody presses play, and we stop the reel a beat before its end
// so YouTube never gets the chance to paper the screen with other
// people's videos — our own end card is already covering it.

interface YTPlayer {
	playVideo(): void;
	pauseVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	getCurrentTime(): number;
	getDuration(): number;
	getPlayerState(): number;
	getVideoLoadedFraction(): number;
	mute(): void;
	unMute(): void;
	isMuted(): boolean;
	setVolume(v: number): void;
	getVolume(): number;
	setPlaybackRate(r: number): void;
	loadModule(name: string): void;
	unloadModule(name: string): void;
	setOption(module: string, option: string, value: unknown): void;
	getAvailablePlaybackRates(): number[];
	destroy(): void;
}

declare global {
	interface Window {
		YT?: {
			Player: new (el: HTMLElement | string, opts: unknown) => YTPlayer;
			PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
		};
		onYouTubeIframeAPIReady?: () => void;
		__swzYTApi?: Promise<Window['YT']>;
	}
}

/** Load the IFrame API once for the whole document. */
function loadApi(): Promise<Window['YT']> {
	if (window.__swzYTApi) return window.__swzYTApi;
	window.__swzYTApi = new Promise((resolve) => {
		if (window.YT && window.YT.Player) {
			resolve(window.YT);
			return;
		}
		const previous = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			try {
				previous?.();
			} catch (e) {
				/* someone else's callback is not our problem */
			}
			resolve(window.YT);
		};
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		tag.async = true;
		document.head.appendChild(tag);
	});
	return window.__swzYTApi;
}

const clock = (s: number) => {
	if (!isFinite(s) || s < 0) s = 0;
	const t = Math.floor(s);
	const h = Math.floor(t / 3600);
	const m = Math.floor((t % 3600) / 60);
	const sec = t % 60;
	const mm = h ? String(m).padStart(2, '0') : String(m);
	return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
};

function setupBoard(root: HTMLElement) {
	if (root.dataset.wbvBound === '1') return;
	root.dataset.wbvBound = '1';

	const videoId = root.dataset.videoId || '';
	if (!videoId) return;

	const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
	const mount = q<HTMLElement>('[data-wbv-mount]');
	const poster = q<HTMLButtonElement>('[data-wbv-play]');
	const spinner = q<HTMLElement>('[data-wbv-boot]');
	const endCard = q<HTMLElement>('[data-wbv-end]');
	const tray = q<HTMLElement>('[data-wbv-tray]');
	const range = q<HTMLInputElement>('[data-wbv-range]');
	const fill = q<HTMLElement>('[data-wbv-fill]');
	const buf = q<HTMLElement>('[data-wbv-buf]');
	const cap = q<HTMLElement>('[data-wbv-cap]');
	const cur = q<HTMLElement>('[data-wbv-cur]');
	const dur = q<HTMLElement>('[data-wbv-dur]');
	const toggle = q<HTMLButtonElement>('[data-wbv-toggle]');
	const back = q<HTMLButtonElement>('[data-wbv-back]');
	const fwd = q<HTMLButtonElement>('[data-wbv-fwd]');
	const speedBtn = q<HTMLButtonElement>('[data-wbv-speed]');
	const menu = q<HTMLElement>('[data-wbv-menu]');
	const rateOut = q<HTMLElement>('[data-wbv-rate]');
	const muteBtn = q<HTMLButtonElement>('[data-wbv-mute]');
	const vol = q<HTMLInputElement>('[data-wbv-vol]');
	const fsBtn = q<HTMLButtonElement>('[data-wbv-fs]');
	const replay = q<HTMLButtonElement>('[data-wbv-replay]');
	const dateOut = q<HTMLElement>('[data-wbv-date]');
	const shield = q<HTMLButtonElement>('[data-wbv-shield]');
	const soundBtn = q<HTMLButtonElement>('[data-wbv-sound]');
	const countBox = q<HTMLElement>('[data-wbv-count]');
	const countNum = q<HTMLElement>('[data-wbv-countn]');
	const pausedCard = q<HTMLElement>('[data-wbv-paused]');
	const thumb = q<HTMLImageElement>('[data-wbv-thumb]');

	if (!mount) return;

	// today's date, in the corner of the board
	if (dateOut) {
		try {
			dateOut.textContent = new Date().toLocaleDateString(undefined, {
				weekday: 'short',
				day: 'numeric',
				month: 'short',
			});
		} catch (e) {
			/* leave the placeholder */
		}
	}

	// maxres does not exist for every upload; fall back quietly
	if (thumb) {
		thumb.addEventListener(
			'error',
			() => {
				const fb = thumb.dataset.fallback;
				if (fb && thumb.src !== fb) thumb.src = fb;
			},
			{ once: true }
		);
	}

	let player: YTPlayer | null = null;
	let raf = 0;
	let scrubbing = false;
	let ended = false;
	let booting = false;
	// We never trust the embed to have honoured an unmute we asked for
	// without a press behind it, so sound is off until somebody says so.
	let soundOn = false;

	const showPaused = (on: boolean) => {
		if (on && !ended) pausedCard?.removeAttribute('hidden');
		else pausedCard?.setAttribute('hidden', '');
	};

	const showEnd = () => {
		if (ended) return;
		ended = true;
		root.removeAttribute('data-playing');
		showPaused(false);
		endCard?.removeAttribute('hidden');
		stopLoop();
	};
	const hideEnd = () => {
		ended = false;
		endCard?.setAttribute('hidden', '');
	};

	const paint = () => {
		if (!player) return;
		const d = player.getDuration() || 0;
		const t = player.getCurrentTime() || 0;
		if (d > 0) {
			// stop a beat short of the end: the reel finishes on our card,
			// never on YouTube's grid of other people's thumbnails
			if (!ended && d - t <= 0.45) {
				try {
					player.pauseVideo();
				} catch (e) {
					/* ignore */
				}
				if (cur) cur.textContent = clock(d);
				if (fill) fill.style.width = '100%';
				if (cap) cap.style.left = '100%';
				if (range) range.value = '1000';
				showEnd();
				return;
			}
			const pct = Math.min(1, t / d);
			if (!scrubbing) {
				if (fill) fill.style.width = pct * 100 + '%';
				if (cap) cap.style.left = pct * 100 + '%';
				if (range) range.value = String(Math.round(pct * 1000));
			}
			if (buf) buf.style.width = (player.getVideoLoadedFraction() || 0) * 100 + '%';
			if (dur) dur.textContent = clock(d);
		}
		if (cur && !scrubbing) cur.textContent = clock(t);
	};

	const loop = () => {
		paint();
		raf = requestAnimationFrame(loop);
	};
	const startLoop = () => {
		if (raf) return;
		raf = requestAnimationFrame(loop);
	};
	const stopLoop = () => {
		if (!raf) return;
		cancelAnimationFrame(raf);
		raf = 0;
	};

	// The reel carries its own burnt-in subtitles, so YouTube's track is
	// a second set of words over the first. `cc_load_policy:0` is only a
	// hint and a viewer whose account forces captions on gets them anyway,
	// so we unload the module AND clear the track — and do it again on
	// every state change, because the player loads the module late and
	// will happily put the captions back after it does.
	const killCaptions = () => {
		if (!player) return;
		const p2 = player;
		['captions', 'cc'].forEach((mod) => {
			try {
				p2.setOption(mod, 'track', {});
			} catch (err) {
				/* module not loaded yet */
			}
			try {
				p2.unloadModule(mod);
			} catch (err) {
				/* module not loaded yet */
			}
		});
	};

	const syncMute = () => {
		if (!player) return;
		const m = !soundOn || player.isMuted() || player.getVolume() === 0;
		if (m) root.setAttribute('data-muted', '');
		else root.removeAttribute('data-muted');
		if (muteBtn) muteBtn.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
		// silence with no explanation reads as a broken laptop, so say it
		// plainly on the picture for as long as it lasts
		if (m && root.hasAttribute('data-playing')) soundBtn?.removeAttribute('hidden');
		else soundBtn?.setAttribute('hidden', '');
	};

	// ── the countdown ────────────────────────────────────────────────
	// The board rolls itself a few seconds after it comes into view, and
	// says so while it waits: a ticking number and a button that will not
	// sit still. Anyone who would rather not wait just presses it.
	const AUTO_SECONDS = 4;
	let countTimer = 0;
	let counting = false;

	const stopCountdown = () => {
		counting = false;
		window.clearInterval(countTimer);
		countTimer = 0;
		root.removeAttribute('data-counting');
		countBox?.setAttribute('hidden', '');
	};

	const startCountdown = () => {
		if (counting || player || booting) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		counting = true;
		let left = AUTO_SECONDS;
		root.style.setProperty('--wbv-cd', AUTO_SECONDS + 's');
		if (countNum) countNum.textContent = String(left);
		countBox?.removeAttribute('hidden');
		root.setAttribute('data-counting', '');
		countTimer = window.setInterval(() => {
			left -= 1;
			if (countNum) countNum.textContent = String(Math.max(0, left));
			if (left <= 0) {
				stopCountdown();
				void start();
			}
		}, 1000);
	};

	const grantSound = () => {
		soundOn = true;
		// The embed answers `isMuted()` across a message channel, so for a
		// beat after unMute() it still says "muted" — believe that and the
		// badge sits there asking for a second tap. Clear the UI on the
		// press, then let the real state catch up.
		root.removeAttribute('data-muted');
		soundBtn?.setAttribute('hidden', '');
		muteBtn?.setAttribute('aria-label', 'Mute');
		try {
			player?.unMute();
			if (vol && player && player.getVolume() === 0) player.setVolume(Number(vol.value));
		} catch (err) {
			/* ignore */
		}
		[250, 800].forEach((ms) => window.setTimeout(syncMute, ms));
	};
	soundBtn?.addEventListener('click', (e) => {
		e.stopPropagation();
		grantSound();
	});

	const start = async () => {
		stopCountdown();
		if (player || booting) {
			player?.playVideo();
			return;
		}
		booting = true;
		poster?.setAttribute('hidden', '');
		poster?.classList.add('is-gone');
		if (poster) poster.style.display = 'none';
		spinner?.removeAttribute('hidden');
		const YT = await loadApi();
		if (!YT) {
			booting = false;
			return;
		}
		player = new YT.Player(mount, {
			videoId,
			playerVars: {
				autoplay: 1,
				mute: 1,
				controls: 0,
				rel: 0,
				modestbranding: 1,
				playsinline: 1,
				iv_load_policy: 3,
				disablekb: 1,
				fs: 0,
				cc_load_policy: 0,
				origin: window.location.origin,
			},
			events: {
				onReady: (e: { target: YTPlayer }) => {
					booting = false;
					player = e.target;
					tray?.removeAttribute('hidden');
					if (dur) dur.textContent = clock(player.getDuration() || 0);
					shield?.removeAttribute('hidden');
					killCaptions();
					try {
						player.playVideo();
					} catch (err) {
						/* the button still works */
					}
					// Every reel opens silent. A browser will not let a video
					// it started by itself make noise, and asking it to
					// anyway leaves the embed reporting sound that is not
					// there — which is exactly how a viewer ends up blaming
					// their speakers. One press turns it on, for good.
					syncMute();
					startLoop();
					[300, 900, 1800, 3200, 6000].forEach((ms) =>
						window.setTimeout(killCaptions, ms)
					);
					window.setTimeout(() => {
						if (!player || ended) return;
						const st = player.getPlayerState();
						const S2 = window.YT?.PlayerState;
						if (S2 && (st === S2.PLAYING || st === S2.BUFFERING)) return;
						// the browser would not start it for us; wear our own
						// paused face so YouTube's never shows
						spinner?.setAttribute('hidden', '');
						showPaused(true);
					}, 1500);
				},
				onStateChange: (e: { data: number }) => {
					const S = YT.PlayerState;
					killCaptions();
					if (e.data === S.PLAYING) {
						hideEnd();
						spinner?.setAttribute('hidden', '');
						showPaused(false);
						root.setAttribute('data-playing', '');
						toggle?.setAttribute('aria-label', 'Pause');
						startLoop();
					} else if (e.data === S.PAUSED) {
						root.removeAttribute('data-playing');
						toggle?.setAttribute('aria-label', 'Play');
						showPaused(true);
					} else if (e.data === S.ENDED) {
						showEnd();
					} else if (e.data === S.BUFFERING) {
						showPaused(false);
					}
					syncMute();
				},
				onPlaybackRateChange: (e: { data: number }) => {
					if (rateOut) rateOut.innerHTML = e.data === 1 ? '1&times;' : e.data + '&times;';
					menu
						?.querySelectorAll<HTMLElement>('.wbv__rate')
						.forEach((b) => b.classList.toggle('is-on', Number(b.dataset.rate) === e.data));
				},
				onError: () => {
					booting = false;
					spinner?.setAttribute('hidden', '');
				},
			},
		});
	};
	poster?.addEventListener('click', () => void start());
	shield?.addEventListener('click', () => toggle?.click());

	toggle?.addEventListener('click', () => {
		if (!player) {
			void start();
			return;
		}
		if (ended) {
			hideEnd();
			player.seekTo(0, true);
			player.playVideo();
			return;
		}
		const S = window.YT?.PlayerState;
		if (S && player.getPlayerState() === S.PLAYING) player.pauseVideo();
		else player.playVideo();
	});

	const nudge = (delta: number) => {
		if (!player) return;
		const d = player.getDuration() || 0;
		const t = Math.max(0, Math.min(d - 0.6, player.getCurrentTime() + delta));
		hideEnd();
		player.seekTo(t, true);
		paint();
	};
	back?.addEventListener('click', () => nudge(-10));
	fwd?.addEventListener('click', () => nudge(10));

	// scrubbing
	const seekFromRange = (commit: boolean) => {
		if (!player || !range) return;
		const d = player.getDuration() || 0;
		const pct = Number(range.value) / 1000;
		if (fill) fill.style.width = pct * 100 + '%';
		if (cap) cap.style.left = pct * 100 + '%';
		if (cur) cur.textContent = clock(pct * d);
		if (commit) {
			hideEnd();
			player.seekTo(Math.min(pct * d, Math.max(0, d - 0.6)), true);
		}
	};
	range?.addEventListener('pointerdown', () => {
		scrubbing = true;
	});
	range?.addEventListener('input', () => {
		scrubbing = true;
		seekFromRange(false);
	});
	const commitSeek = () => {
		if (!scrubbing) return;
		seekFromRange(true);
		scrubbing = false;
	};
	range?.addEventListener('change', commitSeek);
	range?.addEventListener('pointerup', commitSeek);
	range?.addEventListener('pointercancel', commitSeek);

	// speed
	const closeMenu = () => {
		menu?.setAttribute('hidden', '');
		speedBtn?.setAttribute('aria-expanded', 'false');
	};
	speedBtn?.addEventListener('click', (e) => {
		e.stopPropagation();
		const open = menu?.hasAttribute('hidden');
		if (open) {
			menu?.removeAttribute('hidden');
			speedBtn.setAttribute('aria-expanded', 'true');
		} else closeMenu();
	});
	menu?.querySelectorAll<HTMLButtonElement>('.wbv__rate').forEach((b) => {
		b.addEventListener('click', () => {
			const r = Number(b.dataset.rate) || 1;
			player?.setPlaybackRate(r);
			if (rateOut) rateOut.innerHTML = r === 1 ? '1&times;' : r + '&times;';
			menu.querySelectorAll<HTMLElement>('.wbv__rate').forEach((o) => o.classList.remove('is-on'));
			b.classList.add('is-on');
			closeMenu();
		});
	});
	document.addEventListener('click', (e) => {
		if (!menu || menu.hasAttribute('hidden')) return;
		if (!root.contains(e.target as Node)) closeMenu();
	});

	// volume
	muteBtn?.addEventListener('click', () => {
		if (!player) return;
		if (!soundOn || player.isMuted() || player.getVolume() === 0) {
			if (player.getVolume() === 0) player.setVolume(80);
			if (vol) vol.value = String(player.getVolume());
			grantSound();
		} else {
			soundOn = false;
			player.mute();
			syncMute();
		}
	});
	vol?.addEventListener('input', () => {
		if (!player) return;
		const v = Number(vol.value);
		player.setVolume(v);
		if (v > 0) {
			grantSound();
		} else {
			soundOn = false;
			player.mute();
			syncMute();
		}
	});

	// full screen: the whole board goes, chrome and all
	fsBtn?.addEventListener('click', () => {
		if (document.fullscreenElement) document.exitFullscreen?.();
		else root.requestFullscreen?.().catch(() => undefined);
	});

	replay?.addEventListener('click', () => {
		hideEnd();
		if (!player) {
			void start();
			return;
		}
		player.seekTo(0, true);
		player.playVideo();
		startLoop();
	});

	// the reel waits until the board is genuinely on screen; scroll away
	// mid-count and the clock resets rather than playing to nobody
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((en) => {
					if (player || booting) {
						io.disconnect();
						return;
					}
					if (en.isIntersecting) startCountdown();
					else stopCountdown();
				});
			},
			{ threshold: 0.55 }
		);
		io.observe(root);
	}

	// keyboard, once the board has focus
	root.addEventListener('keydown', (e) => {
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' && e.key !== 'Escape') return;
		switch (e.key) {
			case ' ':
			case 'k':
				e.preventDefault();
				toggle?.click();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				nudge(-5);
				break;
			case 'ArrowRight':
				e.preventDefault();
				nudge(5);
				break;
			case 'm':
				muteBtn?.click();
				break;
			case 'f':
				fsBtn?.click();
				break;
			case 'Escape':
				closeMenu();
				break;
		}
	});

	// leaving the page (or swup taking the DOM away) should not leave audio on
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden || !player) return;
		const S = window.YT?.PlayerState;
		if (S && player.getPlayerState() !== S.PLAYING) return;
		try {
			player.pauseVideo();
		} catch (err) {
			/* ignore */
		}
	});
}

export function initWhiteboardVideo() {
	document.querySelectorAll<HTMLElement>('[data-wbv]').forEach(setupBoard);
}
