// Boardroom hero — the cinematic stage.
//
// One full-bleed frame at a time, the way Apple TV+ runs its cover: the
// media fills the screen, a short line sits over it, and the reel moves
// on by itself until you touch it.
//
// Two lessons from the world rail are built in from the start:
//   · A poster never leaves the hit test on pointerdown. Nothing here
//     changes pointer-events at all, so a press can never be retargeted
//     onto the layer behind it.
//   · Autoplay parks the moment a pointer is over the stage, and the
//     progress ring parks with it, so you are never clicking a moving
//     target.
export function initBoardroomHero() {
	const stage = document.querySelector<HTMLElement>('[data-bh]');
	if (!stage) return;
	if (stage.dataset.bhReady === '1') return;
	stage.dataset.bhReady = '1';

	const slides = Array.from(stage.querySelectorAll<HTMLElement>('[data-bh-slide]'));
	const dots = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-bh-dot]'));
	const prev = stage.querySelector<HTMLButtonElement>('[data-bh-prev]');
	const next = stage.querySelector<HTMLButtonElement>('[data-bh-next]');
	const toggle = stage.querySelector<HTMLButtonElement>('[data-bh-toggle]');
	if (slides.length < 2) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const lite = () => document.documentElement.classList.contains('perf-lite');

	const HOLD = 7000; // how long a frame stays up
	let at = 0;
	let timer = 0;
	let started = 0;
	let paused = reduce;
	let hovering = false;

	// ── the film on a slide, if it has one ──────────────────────────────
	// The source is only attached when the slide first comes up, so a
	// visitor who never reaches frame three never downloads it.
	const film = (el: HTMLElement) => el.querySelector<HTMLVideoElement>('video[data-bh-film]');

	const playFilm = (el: HTMLElement) => {
		const v = film(el);
		if (!v || reduce || lite()) return;
		const src = v.dataset.src;
		if (src && !v.src) v.src = src;
		v.play().catch(() => {
			/* a browser that refuses autoplay just shows the poster */
		});
	};
	const stopFilm = (el: HTMLElement) => {
		const v = film(el);
		if (v && !v.paused) v.pause();
	};

	const paint = () => {
		slides.forEach((s, i) => {
			const on = i === at;
			s.classList.toggle('is-on', on);
			s.setAttribute('aria-hidden', String(!on));
			// keep the frame out of the tab order while it is off screen
			s.querySelectorAll<HTMLElement>('a, button').forEach((el) => {
				if (on) el.removeAttribute('tabindex');
				else el.setAttribute('tabindex', '-1');
			});
			if (on) playFilm(s);
			else stopFilm(s);
		});
		dots.forEach((d, i) => {
			d.classList.toggle('is-on', i === at);
			d.setAttribute('aria-selected', String(i === at));
		});
	};

	const restart = () => {
		started = performance.now();
		stage.style.setProperty('--bh-p', '0');
	};

	const go = (i: number) => {
		at = ((i % slides.length) + slides.length) % slides.length;
		paint();
		restart();
	};
	const step = (d: number) => go(at + d);

	// ── the clock ───────────────────────────────────────────────────────
	// One rAF drives both the advance and the ring, so they can never
	// disagree about how much of the frame is left.
	const frame = (now: number) => {
		timer = requestAnimationFrame(frame);
		if (paused || hovering) {
			// hold the ring where it is rather than letting it race on
			started = now - (Number(stage.style.getPropertyValue('--bh-p') || 0) * HOLD);
			return;
		}
		const p = Math.min(1, (now - started) / HOLD);
		stage.style.setProperty('--bh-p', String(p));
		if (p >= 1) step(1);
	};

	const play = () => {
		if (timer) return;
		started = performance.now();
		timer = requestAnimationFrame(frame);
	};
	const stop = () => {
		if (!timer) return;
		cancelAnimationFrame(timer);
		timer = 0;
	};

	// ── controls ────────────────────────────────────────────────────────
	prev?.addEventListener('click', () => step(-1));
	next?.addEventListener('click', () => step(1));
	dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

	toggle?.addEventListener('click', () => {
		paused = !paused;
		toggle.setAttribute('aria-pressed', String(paused));
		toggle.setAttribute('aria-label', paused ? 'Play the reel' : 'Pause the reel');
		stage.classList.toggle('is-paused', paused);
		if (!paused) restart();
	});

	// a pointer over the stage parks the reel; taking it away lets it run
	stage.addEventListener('pointerenter', () => { hovering = true; });
	stage.addEventListener('pointerleave', () => { hovering = false; });
	stage.addEventListener('focusin', () => { hovering = true; });
	stage.addEventListener('focusout', () => { hovering = false; });

	// arrow keys, once the reel has focus
	stage.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
		if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
	});

	// swipe, on a touch screen
	let sx = 0;
	let sy = 0;
	let swiping = false;
	stage.addEventListener('touchstart', (e) => {
		const t = e.touches[0];
		if (!t) return;
		sx = t.clientX;
		sy = t.clientY;
		swiping = true;
	}, { passive: true });
	stage.addEventListener('touchend', (e) => {
		if (!swiping) return;
		swiping = false;
		const t = e.changedTouches[0];
		if (!t) return;
		const dx = t.clientX - sx;
		const dy = t.clientY - sy;
		// only a decisively horizontal flick counts, or scrolling the page
		// past the hero would keep changing the frame under the reader
		if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1);
	}, { passive: true });

	// nothing runs while the hero is off screen or the tab is in the back
	const io = new IntersectionObserver(
		(entries) => entries.forEach((e) => (e.isIntersecting ? play() : stop())),
		{ threshold: 0.15 }
	);
	io.observe(stage);
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) stop();
		else play();
	});

	rotator();
	paint();
	if (reduce) {
		stage.classList.add('is-paused');
		toggle?.setAttribute('aria-pressed', 'true');
	}

	// ── the verb on the first frame ─────────────────────────────────────
	// The window has to be as wide as the word inside it, not as wide as
	// the longest word in the list: fixed to the widest, "ship" left a
	// hole before "it." that you could park a car in. So the width is
	// animated along with the scroll, and the sentence closes up behind
	// each verb.
	function rotator() {
		const rot = stage.querySelector<HTMLElement>('.hero--rot');
		const track = rot?.querySelector<HTMLElement>('.hero--rot-track');
		if (!rot || !track) return;
		const words = Array.from(track.querySelectorAll<HTMLElement>('i'));
		if (words.length < 3) return;
		// the last word is a copy of the first, so the loop can run off the
		// end and be snapped back while nothing is moving
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
				// force the frame so the snap is never seen
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
				// landed on the copy: step back to the original silently
				window.setTimeout(() => { w = 0; show(0, false); }, 700);
			}
		}, 2600);

		// the words change size with the viewport
		let rt = 0;
		window.addEventListener('resize', () => {
			window.clearTimeout(rt);
			rt = window.setTimeout(() => { widths = measure(); show(w, false); }, 150);
		});
	}
}
