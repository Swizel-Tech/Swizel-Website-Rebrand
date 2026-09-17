// The founder's reel.
//
// A portrait YouTube short with every control replaced by ours. It starts
// muted the moment it scrolls into view (the only autoplay a browser will
// allow), loops forever, and hands sound over on one tap. Nothing from
// YouTube loads until the frame is close to the viewport, so the hero is
// never held up by it.
import { loadApi } from './whiteboardVideo';

interface Reel {
	playVideo(): void;
	pauseVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	getCurrentTime(): number;
	getDuration(): number;
	getPlayerState(): number;
	mute(): void;
	unMute(): void;
	isMuted(): boolean;
	setVolume(v: number): void;
	destroy(): void;
}

function setupReel(root: HTMLElement) {
	if (root.dataset.freelBound === '1') return;
	root.dataset.freelBound = '1';

	const videoId = root.dataset.videoId || '';
	if (!videoId) return;

	// A film that must not be followed by anything stops on our own end card
	// rather than looping, so YouTube is never given a chance to draw its
	// suggestion grid.
	const loops = root.dataset.loop !== '0';

	const mount = root.querySelector<HTMLElement>('[data-freel-mount]');
	const poster = root.querySelector<HTMLImageElement>('[data-freel-poster]');
	const shield = root.querySelector<HTMLButtonElement>('[data-freel-shield]');
	const toggle = root.querySelector<HTMLButtonElement>('[data-freel-toggle]');
	const muteBtn = root.querySelector<HTMLButtonElement>('[data-freel-mute]');
	const muteBtn2 = root.querySelector<HTMLButtonElement>('[data-freel-mute2]');
	const nudge = root.querySelector<HTMLButtonElement>('[data-freel-sound-nudge]');
	const track = root.querySelector<HTMLElement>('[data-freel-track]');
	const fill = root.querySelector<HTMLElement>('[data-freel-fill]');
	const buf = root.querySelector<HTMLElement>('[data-freel-buf]');
	const clock = root.querySelector<HTMLElement>('[data-freel-time]');
	const backBtn = root.querySelector<HTMLButtonElement>('[data-freel-back]');
	const fwdBtn = root.querySelector<HTMLButtonElement>('[data-freel-fwd]');
	const replayBtn = root.querySelector<HTMLButtonElement>('[data-freel-replay]');
	if (!mount) return;

	// The cover walks down its fallback list until one loads. It also has to
	// check the current image on the way in: the poster is lazy and may have
	// already failed before this module ran, in which case no error event is
	// ever coming and the frame would sit empty.
	if (poster) {
		const chain = (poster.dataset.fallback || '').split('|').filter(Boolean);
		let step = 0;
		const nextSource = () => {
			while (step < chain.length) {
				const url = chain[step++]!;
				if (url && poster.getAttribute('src') !== url) {
					poster.src = url;
					return true;
				}
			}
			return false;
		};
		poster.addEventListener('error', () => {
			if (!nextSource()) root.classList.add('is-coverless');
		});
		// already decided, and decided badly
		if (poster.complete && poster.naturalWidth === 0) {
			if (!nextSource()) root.classList.add('is-coverless');
		}
	}

	let player: Reel | null = null;
	let raf = 0;
	let booted = false;

	const setPaused = (p: boolean) => root.classList.toggle('is-paused', p);
	const setSound = (on: boolean) => {
		root.classList.toggle('has-sound', on);
		muteBtn?.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
		muteBtn2?.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
	};

	// On a narrow bar there is no room for "0:00 / 9:41", and the second half
	// was being cut to "0:" — worse than useless. Below this width the clock
	// shows the position only.
	const tight = window.matchMedia('(max-width: 430px)');

	// 9:16 was the aspect ratio wearing a clock's clothes. This is the time.
	const clockText = (secs: number) => {
		const t = Math.max(0, Math.floor(secs));
		const m = Math.floor(t / 60);
		const r = t % 60;
		return `${m}:${String(r).padStart(2, '0')}`;
	};

	const draw = () => {
		if (player) {
			const d = player.getDuration();
			if (d > 0) {
				const now = player.getCurrentTime();
				if (fill) {
					const p = Math.min(Math.max(now / d, 0), 1);
					fill.style.width = (p * 100).toFixed(2) + '%';
				}
				if (buf) {
					const frac = (player as any).getVideoLoadedFraction?.();
					if (typeof frac === 'number') buf.style.width = (frac * 100).toFixed(1) + '%';
				}
				if (clock) {
					clock.textContent = tight.matches
						? clockText(now)
						: `${clockText(now)} / ${clockText(d)}`;
				}
			}
		}
		raf = requestAnimationFrame(draw);
	};

	const boot = () => {
		if (booted) return;
		booted = true;

		loadApi().then((YT) => {
			if (!YT) return;
			const host = document.createElement('div');
			mount.appendChild(host);

			player = new YT.Player(host, {
				videoId,
				host: 'https://www.youtube-nocookie.com',
				playerVars: {
					autoplay: 1,
					mute: 1,
					loop: loops ? 1 : 0,
					// loop needs an explicit single-item playlist; a one-item
					// playlist on a non-looping film also stops YouTube reaching
					// for something of its own to play next
					playlist: videoId,
					controls: 0,
					rel: 0,
					modestbranding: 1,
					playsinline: 1,
					disablekb: 1,
					fs: 0,
					iv_load_policy: 3,
				},
				events: {
					onReady: (e: { target: Reel }) => {
						player = e.target;
						player.mute();
						player.playVideo();
						// `is-live` (which lifts the cover) is set on the first
						// PLAYING state, not here: at this point the player exists
						// but no frame has arrived, and dropping the cover now
						// shows a black rectangle for as long as it buffers.
						setPaused(false);
						setSound(false);
						cancelAnimationFrame(raf);
						raf = requestAnimationFrame(draw);
					},
					onStateChange: (e: { data: number }) => {
						// 1 playing, 2 paused, 0 ended
						if (e.data === 1) {
							setPaused(false);
							root.classList.add('is-live');
							root.classList.remove('is-ended');
						}
						if (e.data === 2) setPaused(true);
						if (e.data === 0) {
							if (loops) {
								player?.playVideo();
							} else {
								// stop it dead on the last frame and cover it with
								// our own card. Nothing else plays, and no
								// suggestion grid is ever drawn.
								player?.pauseVideo();
								setPaused(true);
								root.classList.add('is-ended');
							}
						}
					},
				},
			}) as unknown as Reel;
		});
	};

	// whatever happens, the cover comes off within a few seconds: a film that
	// is blocked or refuses to start must not leave a dead still behind
	window.setTimeout(() => {
		if (booted) root.classList.add('is-live');
	}, 6000);

	// nothing from YouTube until the frame is nearly on screen
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((en) => {
					if (en.isIntersecting) {
						boot();
						io.disconnect();
					}
				});
			},
			{ rootMargin: '240px' }
		);
		io.observe(root);
	} else {
		boot();
	}

	// pause when it leaves the screen entirely — a reel playing to nobody is
	// just a battery bill
	if ('IntersectionObserver' in window) {
		const away = new IntersectionObserver(
			(entries) => {
				entries.forEach((en) => {
					if (!player) return;
					if (!en.isIntersecting && player.getPlayerState() === 1) {
						player.pauseVideo();
						root.dataset.freelAuto = '1';
					} else if (en.isIntersecting && root.dataset.freelAuto === '1') {
						root.dataset.freelAuto = '';
						player.playVideo();
					}
				});
			},
			{ threshold: 0.15 }
		);
		away.observe(root);
	}

	const togglePlay = () => {
		if (!player) return;
		if (player.getPlayerState() === 1) player.pauseVideo();
		else player.playVideo();
	};

	const giveSound = () => {
		if (!player) return;
		if (player.isMuted()) {
			player.unMute();
			player.setVolume(85);
			setSound(true);
		} else {
			player.mute();
			setSound(false);
		}
		if (player.getPlayerState() !== 1) player.playVideo();
	};

	// ten seconds either way, clamped so a skip can never run off the end
	const jump = (by: number, btn?: HTMLButtonElement | null) => {
		if (!player) return;
		const d = player.getDuration();
		if (!(d > 0)) return;
		const to = Math.min(Math.max(player.getCurrentTime() + by, 0), Math.max(d - 0.3, 0));
		player.seekTo(to, true);
		if (root.classList.contains('is-ended')) {
			root.classList.remove('is-ended');
			player.playVideo();
		}
		if (btn) {
			btn.classList.remove('is-hit');
			// restart the confirmation pulse even on a rapid second press
			void btn.offsetWidth;
			btn.classList.add('is-hit');
		}
	};

	shield?.addEventListener('click', () => {
		root.classList.add('is-nudged');
		togglePlay();
	});
	toggle?.addEventListener('click', togglePlay);
	backBtn?.addEventListener('click', () => jump(-10, backBtn));
	fwdBtn?.addEventListener('click', () => jump(10, fwdBtn));
	replayBtn?.addEventListener('click', () => {
		if (!player) return;
		root.classList.remove('is-ended');
		player.seekTo(0, true);
		player.playVideo();
	});
	muteBtn?.addEventListener('click', giveSound);
	muteBtn2?.addEventListener('click', giveSound);
	nudge?.addEventListener('click', () => {
		root.classList.add('is-nudged');
		if (player && player.isMuted()) giveSound();
	});

	track?.addEventListener('click', (ev) => {
		if (!player) return;
		const r = track.getBoundingClientRect();
		const p = Math.min(Math.max((ev.clientX - r.left) / r.width, 0), 1);
		const d = player.getDuration();
		if (d > 0) player.seekTo(p * d, true);
	});

	// the nudge has said its piece after a while either way
	setTimeout(() => root.classList.add('is-nudged'), 9000);
}

export function initFounderReel() {
	document
		.querySelectorAll<HTMLElement>('[data-freel]')
		.forEach((el) => setupReel(el));
}
