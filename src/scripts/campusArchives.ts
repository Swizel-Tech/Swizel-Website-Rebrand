// The archives reel (Campus home, section C3).
//
// The screen is a facade: the poster is a still from YouTube's CDN and
// nothing else is requested until someone presses play. On press the whole
// button is replaced by a nocookie iframe, so the section costs nothing on
// a page that already carries the hero board.
export function initCampusArchives() {
	// maxresdefault does not exist for every upload; drop to hqdefault
	document
		.querySelectorAll<HTMLImageElement>('[data-arch-poster]')
		.forEach((img) => {
			if (img.dataset.archFallback) return;
			const drop = () => {
				const id = img.dataset.archPoster;
				if (!id || img.dataset.archFallback) return;
				img.dataset.archFallback = '1';
				img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
			};
			img.addEventListener('error', drop);
			// it may already have failed before this ran
			if (img.complete && img.naturalWidth === 0) drop();
		});

	document
		.querySelectorAll<HTMLButtonElement>('[data-arch-play]')
		.forEach((btn) => {
			if (btn.dataset.archBound) return;
			btn.dataset.archBound = '1';

			btn.addEventListener('click', () => {
				const id = btn.dataset.archPlay;
				const host = btn.parentElement;
				if (!id || !host) return;

				const frame = document.createElement('iframe');
				frame.className = 'arch__screen--live';
				frame.title = 'Swizel Campus reel';
				frame.src =
					`https://www.youtube-nocookie.com/embed/${id}` +
					'?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3';
				frame.allow =
					'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
				frame.setAttribute('allowfullscreen', '');
				frame.setAttribute('loading', 'lazy');

				host.replaceChild(frame, btn);
			});
		});
}
