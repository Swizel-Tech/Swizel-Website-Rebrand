
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
		}

		// the print wall drifts on its own where it is a rail (phones)
		const rail = spot.querySelector<HTMLElement>('[data-spot-rail]');
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
}
