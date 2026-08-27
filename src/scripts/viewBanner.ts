import { views, DEFAULT_VIEW } from '../consts';
import { applyView } from './viewExperience';

// Powers the "choose your world" rail under the hero: keeps the headline in
// sync with the active view, marks the current poster, and switches worlds
// on tap.
//
// The rail drifts forever. The track is duplicated once, and a single rAF
// loop walks a virtual position across it; when that position passes the
// halfway mark it drops back by exactly one copy, which is invisible because
// the content there is identical. On top of that drift you can still grab it,
// flick it, wheel it or use the arrows — every one of those hands control
// over, and the drift only takes the wheel back after you have let go.
export function initViewBanner() {
	const banner = document.getElementById('view-banner');
	if (!banner) return;

	const name = banner.querySelector<HTMLElement>('#vb-name');
	const aud = banner.querySelector<HTMLElement>('#vb-aud');
	const rail = banner.querySelector<HTMLElement>('#vw-rail');
	const track = banner.querySelector<HTMLElement>('.vw-track');

	// ── duplicate the posters so the rail has somewhere to wrap to ──────
	// Done before anything is wired up, and every card is reached by
	// delegation afterwards, so the copies behave exactly like the originals.
	if (track && !track.dataset.looped) {
		const originals = Array.from(track.children);
		originals.forEach((el) => {
			const copy = el.cloneNode(true) as HTMLElement;
			copy.setAttribute('aria-hidden', 'true');
			copy.setAttribute('tabindex', '-1');
			copy.dataset.clone = '1';
			track.appendChild(copy);
		});
		track.dataset.looped = '1';
	}

	const allCards = () =>
		Array.from(banner.querySelectorAll<HTMLButtonElement>('[data-switch-view]'));

	const sync = () => {
		const id =
			document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
		const v = views.find((x) => x.id === id) || views[0];
		if (name) name.textContent = v?.name ?? '';
		if (aud) aud.textContent = v?.audience ?? '';
		allCards().forEach((c) =>
			c.classList.toggle('is-current', c.dataset.switchView === id)
		);
	};

	// one listener for every poster, original or copy
	banner.addEventListener('click', (e) => {
		const card = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
			'[data-switch-view]'
		);
		if (!card || !banner.contains(card)) return;
		let id = card.dataset.switchView;
		if (!id || card.classList.contains('is-current')) return;
		// the "Surprise me" poster: roll a random world (never the current one)
		if (id === 'surprise') {
			const current =
				document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
			const pool = views.map((v) => v.id).filter((v) => v !== current);
			id = pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_VIEW;
		}
		applyView(id); // applyView handles the scroll-to-top
	});

	// ── the rail: endless drift, arrows, drag, swipe ────────────────────
	const prev = banner.querySelector<HTMLButtonElement>('[data-vw-prev]');
	const next = banner.querySelector<HTMLButtonElement>('[data-vw-next]');
	const progress = banner.querySelector<HTMLElement>('#vw-progress-bar');

	if (rail) {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const lite = () => document.documentElement.classList.contains('perf-lite');

		// px per second — slow enough to read a poster as it passes. The
		// drift is one scrollLeft write per frame, so it is cheap enough to
		// keep on a weak machine; lite mode only slows it down.
		const speed = () => (lite() ? 16 : 26);

		// one copy of the track; the wrap point
		const loop = () => Math.max(1, rail.scrollWidth / 2);

		const step = () => {
			const card = rail.querySelector<HTMLElement>('.vw-card');
			if (!card) return rail.clientWidth * 0.8;
			const gap = parseFloat(getComputedStyle(card).marginRight || '0');
			return card.offsetWidth + gap;
		};

		let pos = 0; // virtual scroll position
		let target: number | null = null; // set while an arrow press is easing
		let hovering = false;
		let dragging = false;
		let resumeAt = 0; // drift stays parked until this timestamp
		let applied = -1; // the last scrollLeft we wrote ourselves
		let last = performance.now();

		const hold = (ms = 2600) => {
			resumeAt = performance.now() + ms;
		};

		const paint = () => {
			const l = loop();
			if (progress) {
				const w = progress.parentElement?.clientWidth || 0;
				const pct = ((pos % l) + l) % l / l;
				progress.style.transform = `translateX(${pct * (w - w * 0.22)}px)`;
			}
		};

		const go = (dir: 1 | -1) => {
			hold(4000);
			target = (target ?? pos) + dir * step();
			play(); // in case the loop had parked
		};

		prev?.addEventListener('click', () => go(-1));
		next?.addEventListener('click', () => go(1));

		// drag with a mouse, exactly as you would flick it on a phone
		let startX = 0;
		let startPos = 0;
		let moved = 0;
		rail.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'touch') return; // let the OS do native swipe
			dragging = true;
			moved = 0;
			startX = e.clientX;
			startPos = pos;
			target = null;
			rail.classList.add('is-dragging');
			hold();
			play();
		});
		rail.addEventListener('pointermove', (e) => {
			if (!dragging) return;
			const dx = e.clientX - startX;
			moved = Math.abs(dx);
			pos = startPos - dx;
		});
		const endDrag = () => {
			if (!dragging) return;
			dragging = false;
			rail.classList.remove('is-dragging');
			hold();
		};
		rail.addEventListener('pointerup', endDrag);
		rail.addEventListener('pointercancel', endDrag);
		rail.addEventListener('pointerleave', endDrag);
		// a drag should never be mistaken for a click on a poster
		rail.addEventListener(
			'click',
			(e) => {
				if (moved > 6) {
					e.preventDefault();
					e.stopPropagation();
					moved = 0;
				}
			},
			true
		);

		// native swipe and trackpad scroll move scrollLeft behind our back;
		// adopt whatever the browser did rather than yanking it back
		rail.addEventListener(
			'scroll',
			() => {
				if (Math.abs(rail.scrollLeft - applied) > 1) {
					pos = rail.scrollLeft;
					target = null;
					hold();
				}
				paint();
			},
			{ passive: true }
		);
		rail.addEventListener('wheel', () => hold(), { passive: true });
		rail.addEventListener('touchstart', () => hold(), { passive: true });

		// hover parks it; the pointer leaving lets it go again
		rail.addEventListener('pointerenter', () => {
			hovering = true;
		});
		rail.addEventListener('pointerleave', () => {
			hovering = false;
			hold(400);
		});
		rail.addEventListener('focusin', () => hold(6000));

		let raf = 0;
		const frame = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			const l = loop();

			if (target !== null) {
				// ease toward the arrow's destination
				pos += (target - pos) * Math.min(1, dt * 7);
				if (Math.abs(target - pos) < 0.6) {
					pos = target;
					target = null;
				}
			} else if (!reduce && !hovering && !dragging && now >= resumeAt) {
				pos += speed() * dt;
			}

			// wrap; the copy underneath is identical, so nothing is seen
			if (pos >= l) {
				pos -= l;
				if (target !== null) target -= l;
			} else if (pos < 0) {
				pos += l;
				if (target !== null) target += l;
			}

			applied = pos;
			rail.scrollLeft = pos;
			paint();
			raf = requestAnimationFrame(frame);
		};

		let onScreen = true;
		const play = () => {
			if (raf || document.hidden || !onScreen) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		};
		const pause = () => {
			if (!raf) return;
			cancelAnimationFrame(raf);
			raf = 0;
		};

		// nothing should animate off-screen or in a background tab
		document.addEventListener('visibilitychange', () =>
			document.hidden ? pause() : play()
		);
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(entries) => {
					const e = entries[0];
					if (!e) return;
					onScreen = e.isIntersecting;
					if (onScreen) play();
					else pause();
				},
				{ threshold: 0.05 }
			).observe(rail);
		}

		window.addEventListener('resize', paint);
		paint();
		play();
	}

	window.addEventListener('swizel:viewchange', sync);
	sync();
}
