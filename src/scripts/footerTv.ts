// Swizel TV in the footer.
//
// The src is the channel's uploads playlist, so it always carries the
// newest videos and rolls one into the next with nothing to maintain by
// hand. Nothing loads until the footer is actually on screen, and it
// starts muted, because a footer that ambushes you with sound is worse
// than no footer at all. Tapping the poster counts as a gesture, so that
// route starts with the sound on.
export function initFooterTv() {
	document.querySelectorAll<HTMLElement>('[data-ft-tv]').forEach((tv) => {
		if (tv.dataset.tvBound === '1') return;
		tv.dataset.tvBound = '1';

		const mount = tv.querySelector<HTMLElement>('[data-ft-tv-mount]');
		const poster = tv.querySelector<HTMLButtonElement>('[data-ft-tv-play]');
		const sound = tv.querySelector<HTMLButtonElement>('[data-ft-tv-sound]');
		const list = tv.dataset.list;
		if (!mount || !list) return;

		let frame: HTMLIFrameElement | null = null;

		// cc_load_policy=0 is only a hint and the captions module loads late,
		// so the postMessage below actually unloads it. Every video already
		// carries its own burnt-in subtitles; YouTube's would be a second set.
		const src = (muted: boolean) =>
			`https://www.youtube-nocookie.com/embed/videoseries?list=${list}` +
			`&autoplay=1&mute=${muted ? 1 : 0}&loop=1&playsinline=1` +
			`&modestbranding=1&rel=0&enablejsapi=1&cc_load_policy=0&cc_lang_pref=none&iv_load_policy=3`;

		const killCaptions = () => {
			const win = frame?.contentWindow;
			if (!win) return;
			['captions', 'cc'].forEach((mod) => {
				try {
					win.postMessage(
						JSON.stringify({ event: 'command', func: 'unloadModule', args: [mod] }),
						'*'
					);
					win.postMessage(
						JSON.stringify({ event: 'command', func: 'setOption', args: [mod, 'track', {}] }),
						'*'
					);
				} catch (err) {
					/* the frame is not ready yet; a later pass gets it */
				}
			});
		};

		const load = (muted: boolean) => {
			if (frame) {
				// already running: swapping the src is how we unmute, since we
				// deliberately never load the full player API down here
				frame.src = src(muted);
			} else {
				frame = document.createElement('iframe');
				frame.title = 'Swizel Technologies on YouTube';
				frame.allow =
					'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
				frame.setAttribute('allowfullscreen', '');
				frame.loading = 'lazy';
				frame.referrerPolicy = 'strict-origin-when-cross-origin';
				frame.src = src(muted);
				mount.appendChild(frame);
			}
			tv.setAttribute('data-playing', '');
			// the module loads late and reloads between playlist items, so
			// keep knocking it down for a while after each start
			[400, 1200, 2400, 4200, 7000, 11000].forEach((ms) =>
				window.setTimeout(killCaptions, ms)
			);
			frame.addEventListener('load', () => {
				[300, 900, 2000].forEach((ms) => window.setTimeout(killCaptions, ms));
			});
			if (muted) sound?.removeAttribute('hidden');
			else sound?.setAttribute('hidden', '');
		};

		poster?.addEventListener('click', () => load(false));
		sound?.addEventListener('click', () => load(false));

		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => {
					entries.forEach((e) => {
						if (!e.isIntersecting) return;
						io.disconnect();
						if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
							load(true);
						}
					});
				},
				{ threshold: 0.4 }
			);
			io.observe(tv);
		}
	});
}
