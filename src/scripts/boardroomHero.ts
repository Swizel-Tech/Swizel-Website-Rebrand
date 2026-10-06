// Boardroom hero — the film behind the words, and the two small things
// that sit on top of it.
//
// The backdrop is a single YouTube film mounted through the IFrame API
// rather than as a bare autoplay iframe, because the transport on the
// floor of the cover has to actually drive it: back ten, play, on ten,
// sound. A raw iframe can only be started, never steered.
//
// It starts muted, like every film on the site, and the sound control
// breathes until it has been understood — the same beat and the same hint
// the rest of the site uses.
import { loadApi } from './whiteboardVideo';
import { FILM_DELAY, hintUnmute } from './filmAutoplay';

interface Film {
	playVideo(): void;
	pauseVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	getCurrentTime(): number;
	getDuration(): number;
	getPlayerState(): number;
	mute(): void;
	unMute(): void;
	isMuted(): boolean;
	destroy(): void;
	setOption(module: string, option: string, value: unknown): void;
	unloadModule(module: string): void;
}

export function initBoardroomHero() {
	const stage = document.querySelector<HTMLElement>('[data-bh]');
	if (!stage) return;
	if (stage.dataset.bhReady === '1') return;
	stage.dataset.bhReady = '1';

	const host = stage.querySelector<HTMLElement>('[data-bh-yt]');
	const backBtn = stage.querySelector<HTMLButtonElement>('[data-bh-back]');
	const playBtn = stage.querySelector<HTMLButtonElement>('[data-bh-play]');
	const fwdBtn = stage.querySelector<HTMLButtonElement>('[data-bh-fwd]');
	const muteBtn = stage.querySelector<HTMLButtonElement>('[data-bh-mute]');
	const transport = stage.querySelector<HTMLElement>('[data-bh-transport]');

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let film: Film | null = null;
	// what the visitor asked for, kept apart from whatever YouTube reports:
	// a play() issued while the iframe is warming can land after a pause()
	// pressed a moment later, and the film carries on as if the button did
	// nothing. This is the instruction; onStateChange re-asserts it.
	let want = false;
	let muted = true;

	const paint = () => {
		stage.classList.toggle('is-filmplaying', !!film && film.getPlayerState() === 1);
		stage.classList.toggle('is-filmmuted', muted);
		playBtn?.setAttribute('aria-label', want ? 'Pause the film' : 'Play the film');
		muteBtn?.setAttribute('aria-pressed', String(muted));
		muteBtn?.setAttribute('aria-label', muted ? 'Unmute the film' : 'Mute the film');
	};

	// ── no captions, ever ───────────────────────────────────────────────
	// `cc_load_policy: 0` is only a hint. A viewer whose YouTube account
	// forces subtitles on gets them anyway, and the player loads its
	// captions module late — and again every time the loop restarts the
	// film — so the hint alone lets them creep back. The track is cleared
	// and the module unloaded the moment it appears (onApiChange), on every
	// state change, on a run of passes after each start, and on a slow
	// guard while it plays. Same treatment as the whiteboard and footer
	// players.
	const killCaptions = () => {
		if (!film) return;
		const f = film;
		['captions', 'cc'].forEach((mod) => {
			try { f.setOption(mod, 'track', {}); } catch { /* not loaded yet */ }
			try { f.unloadModule(mod); } catch { /* not loaded yet */ }
		});
	};
	const sweep = () =>
		[250, 800, 1600, 3000, 5000, 8000].forEach((ms) => window.setTimeout(killCaptions, ms));
	let guard = 0;
	const guardOn = () => {
		if (!guard) guard = window.setInterval(killCaptions, 4000);
	};
	const guardOff = () => {
		if (guard) { window.clearInterval(guard); guard = 0; }
	};

	// ── the backdrop ────────────────────────────────────────────────────
	const mount = async () => {
		if (!host || film) return;
		const id = host.dataset.bhYt;
		if (!id) return;
		const YT = await loadApi().catch(() => null);
		if (!YT?.Player) return;
		const seat = document.createElement('div');
		host.appendChild(seat);
		film = new YT.Player(seat, {
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
				// no subtitles burned over the backdrop: the hero film is
				// wallpaper behind the headline, and a caption track fighting
				// that headline is the one thing it must not do
				cc_load_policy: 0,
				cc_lang_pref: 'none',
				disablekb: 1,
				fs: 0,
				showinfo: 0,
			},
			events: {
				onReady: () => {
					killCaptions();
					sweep();
					film?.mute();
					muted = true;
					want = true;
					film?.playVideo();
					// let it get going before it is faded up, so the cut from
					// the still is never a black flash
					window.setTimeout(() => host.classList.add('is-live'), 700);
					// it is playing, and it is silent: say so, the same way
					// every other player on the site does
					if (muteBtn) hintUnmute(muteBtn);
					paint();
				},
				// fired when the player loads a module with its own API —
				// which, for this player, is the captions module arriving
				onApiChange: () => killCaptions(),
				onStateChange: (e: { data: number }) => {
					killCaptions();
					if (e?.data === 1) { sweep(); guardOn(); }
					else if (e?.data === 2) guardOff();
					// 0 ENDED · 1 PLAYING · 2 PAUSED.
					//
					// The backdrop must never stop and never go blank: an
					// ended film shows YouTube's own end card, and a paused
					// one shows its big centre play button — both of which
					// put a control in the middle of a cover that already
					// has its transport on the floor. So it is put straight
					// back to work unless the visitor was the one who
					// stopped it.
					if (e?.data === 0) {
						film?.seekTo(0, true);
						if (want) film?.playVideo();
					} else if (e?.data === 2 && want) {
						film?.playVideo();
					} else if (e?.data === 1 && !want) {
						// a queued play landing late — the last instruction wins
						film?.pauseVideo();
					}
					paint();
				},
			},
		}) as unknown as Film;
	};

	// nothing loads until the cover is actually on screen, and it waits the
	// same beat every film on the site waits
	if (!reduce && 'IntersectionObserver' in window) {
		let timer = 0;
		const io = new IntersectionObserver(
			(entries) => {
				const en = entries[0];
				if (!en) return;
				if (en.isIntersecting) {
					if (!timer) timer = window.setTimeout(() => { io.disconnect(); void mount(); }, FILM_DELAY);
				} else if (timer) {
					window.clearTimeout(timer);
					timer = 0;
				}
			},
			{ threshold: 0.2 }
		);
		io.observe(stage);
	}

	// ── the transport ───────────────────────────────────────────────────
	const seek = (by: number) => {
		if (!film) return;
		const d = film.getDuration() || 0;
		let to = film.getCurrentTime() + by;
		if (to < 0) to = 0;
		if (d > 0 && to > d) to = d;
		film.seekTo(to, true);
	};
	backBtn?.addEventListener('click', () => seek(-10));
	fwdBtn?.addEventListener('click', () => seek(10));
	playBtn?.addEventListener('click', () => {
		if (!film) return;
		if (film.getPlayerState() === 1) {
			want = false;
			film.pauseVideo();
		} else {
			want = true;
			film.playVideo();
		}
		paint();
	});
	muteBtn?.addEventListener('click', () => {
		if (!film) return;
		muted = !muted;
		muted ? film.mute() : film.unMute();
		paint();
	});

	// the film has no business running while nobody is looking at it
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(
			(entries) => {
				const en = entries[0];
				if (!en || !film) return;
				if (!en.isIntersecting && film.getPlayerState() === 1) {
					want = false;
					film.pauseVideo();
					paint();
				}
			},
			{ threshold: 0.15 }
		).observe(stage);
	}
	document.addEventListener('visibilitychange', () => {
		if (document.hidden && film && film.getPlayerState() === 1) {
			want = false;
			film.pauseVideo();
			paint();
		}
	});

	rotator();
	paint();
	if (transport) transport.dataset.ready = '1';

	// ── the verb on the headline ────────────────────────────────────────
	// The window has to be as wide as the word inside it, not as wide as
	// the longest word in the list: fixed to the widest, "ship" left a hole
	// before the next word you could park a car in. So the width is
	// animated along with the scroll.
	function rotator() {
		const rot = stage!.querySelector<HTMLElement>('.hero--rot');
		const track = rot?.querySelector<HTMLElement>('.hero--rot-track');
		if (!rot || !track) return;
		const words = Array.from(track.querySelectorAll<HTMLElement>('i'));
		if (words.length < 3) return;
		const last = words.length - 1;
		let w = 0;

		const measure = () => words.map((el) => el.getBoundingClientRect().width);
		let widths = measure();
		const stepH = () => words[0]!.getBoundingClientRect().height;

		const show = (i: number, animate = true) => {
			track.style.transition = animate ? '' : 'none';
			rot.style.transition = animate ? '' : 'none';
			rot.style.width = `${widths[i]}px`;
			track.style.transform = `translateY(${-i * stepH()}px)`;
			if (!animate) {
				void track.offsetHeight;
				track.style.transition = '';
				rot.style.transition = '';
			}
		};

		show(0, false);
		if (reduce) return;

		window.setInterval(() => {
			w += 1;
			show(w);
			if (w === last) {
				window.setTimeout(() => { w = 0; show(0, false); }, 700);
			}
		}, 2600);

		let rt = 0;
		window.addEventListener('resize', () => {
			window.clearTimeout(rt);
			rt = window.setTimeout(() => { widths = measure(); show(w, false); }, 150);
		});
	}
}
