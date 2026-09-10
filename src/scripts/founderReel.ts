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

	const mount = root.querySelector<HTMLElement>('[data-freel-mount]');
	const poster = root.querySelector<HTMLImageElement>('[data-freel-poster]');
	const shield = root.querySelector<HTMLButtonElement>('[data-freel-shield]');
	const toggle = root.querySelector<HTMLButtonElement>('[data-freel-toggle]');
	const muteBtn = root.querySelector<HTMLButtonElement>('[data-freel-mute]');
	const nudge = root.querySelector<HTMLButtonElement>('[data-freel-sound-nudge]');
	const track = root.querySelector<HTMLElement>('[data-freel-track]');
	const fill = root.querySelector<HTMLElement>('[data-freel-fill]');
	if (!mount) return;

	// maxresdefault does not exist for every upload
	poster?.addEventListener('error', () => {
		const fb = poster.dataset.fallback;
		if (fb && poster.src !== fb) poster.src = fb;
	});

	let player: Reel | null = null;
	let raf = 0;
	let booted = false;

	const setPaused = (p: boolean) => root.classList.toggle('is-paused', p);
	const setSound = (on: boolean) => {
		root.classList.toggle('has-sound', on);
		muteBtn?.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
	};

	const draw = () => {
		if (player && fill) {
			const d = player.getDuration();
			if (d > 0) {
				const p = Math.min(Math.max(player.getCurrentTime() / d, 0), 1);
				fill.style.width = (p * 100).toFixed(2) + '%';
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
					loop: 1,
					playlist: videoId, // loop needs an explicit single-item playlist
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
						root.classList.add('is-live');
						setPaused(false);
						setSound(false);
						cancelAnimationFrame(raf);
						raf = requestAnimationFrame(draw);
					},
					onStateChange: (e: { data: number }) => {
						// 1 playing, 2 paused, 0 ended
						if (e.data === 1) setPaused(false);
						if (e.data === 2) setPaused(true);
						if (e.data === 0) player?.playVideo();
					},
				},
			}) as unknown as Reel;
		});
	};

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

	shield?.addEventListener('click', () => {
		root.classList.add('is-nudged');
		togglePlay();
	});
	toggle?.addEventListener('click', togglePlay);
	muteBtn?.addEventListener('click', giveSound);
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
