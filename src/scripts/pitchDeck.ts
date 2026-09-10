// The pitch deck's clicker.
//
// Slide state, autoplay, arrow keys, swipe — and the light switch, which
// pulls the deck out of the page into the middle of the screen, drops a
// blackout over everything else, and traps the keyboard until Esc.
export function initPitchDeck() {
	const deck = document.querySelector<HTMLElement>('[data-pdeck]');
	if (!deck || deck.dataset.pdBound === '1') return;
	deck.dataset.pdBound = '1';

	const slides = Array.from(deck.querySelectorAll<HTMLElement>('[data-pd-slide]'));
	if (!slides.length) return;
	const dots = Array.from(deck.querySelectorAll<HTMLElement>('[data-pd-dot]'));
	const now = deck.querySelector<HTMLElement>('[data-pd-now]');
	const prog = deck.querySelector<HTMLElement>('[data-pd-prog]');
	const stage = deck.querySelector<HTMLElement>('[data-pd-stage]');
	const prev = deck.querySelector<HTMLButtonElement>('[data-pd-prev]');
	const next = deck.querySelector<HTMLButtonElement>('[data-pd-next]');
	const playBtn = deck.querySelector<HTMLButtonElement>('[data-pd-play]');
	const lightsBtn = deck.querySelector<HTMLButtonElement>('[data-pd-lights]');
	const lightsTxt = deck.querySelector<HTMLElement>('[data-pd-lights-t]');
	const exitBtn = deck.querySelector<HTMLButtonElement>('[data-pd-exit]');
	const blackout = document.querySelector<HTMLElement>('[data-pd-blackout]');

	// the blackout must be a child of <body>: a transformed ancestor anywhere
	// up the founder body would turn its `position: fixed` into something
	// stuck inside a section
	if (blackout && blackout.parentElement !== document.body) {
		document.body.appendChild(blackout);
	}

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const total = slides.length;
	let i = 0;
	let timer = 0;
	let playing = false;
	let theatre = false;

	// where the deck sits in the page, so it can be put back
	const home = document.createElement('div');
	home.className = 'pdeck-hole';
	let holeHeight = 0;

	const show = (n: number, dir = 1) => {
		const target = ((n % total) + total) % total;
		slides.forEach((s, k) => {
			s.classList.toggle('is-on', k === target);
			s.classList.toggle('is-out', dir > 0 ? k < target : k > target);
			s.setAttribute('aria-hidden', k === target ? 'false' : 'true');
		});
		dots.forEach((d, k) =>
			d.setAttribute('aria-selected', k === target ? 'true' : 'false')
		);
		i = target;
		if (now) now.textContent = String(target + 1).padStart(2, '0');
		if (prog) prog.style.width = (((target + 1) / total) * 100).toFixed(1) + '%';
		const accent = slides[target].style.getPropertyValue('--pd-a').trim();
		if (accent) deck.style.setProperty('--pd-acc', accent);
	};

	const go = (d: number) => {
		show(i + d, d);
		if (playing) arm();
	};

	const arm = () => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			if (!playing) return;
			show(i + 1, 1);
			arm();
		}, 6200);
	};

	const setPlaying = (on: boolean) => {
		playing = on;
		deck.classList.toggle('is-playing', on);
		playBtn?.setAttribute('aria-label', on ? 'Pause the deck' : 'Play the deck');
		const t = playBtn?.querySelector('.pdeck__tool-t');
		if (t) t.textContent = on ? 'Pause' : 'Play';
		window.clearTimeout(timer);
		if (on) arm();
	};

	// ── the light switch ──────────────────────────────────────────
	const lightsOut = () => {
		if (theatre) return;
		theatre = true;

		// hold the deck's place so the page behind does not collapse
		holeHeight = deck.getBoundingClientRect().height;
		home.style.height = holeHeight + 'px';
		deck.parentNode?.insertBefore(home, deck);
		document.body.appendChild(deck);

		deck.classList.add('is-theatre');
		document.documentElement.classList.add('pd-lights-out');
		document.body.style.overflow = 'hidden';
		if (blackout) {
			blackout.hidden = false;
			// a frame, so the transition actually runs
			requestAnimationFrame(() => blackout.classList.add('is-on'));
		}
		lightsBtn?.setAttribute('aria-pressed', 'true');
		if (lightsTxt) lightsTxt.textContent = 'Lights on';
		stage?.focus();
		if (!reduce) setPlaying(true);
	};

	const lightsOn = () => {
		if (!theatre) return;
		theatre = false;
		setPlaying(false);

		deck.classList.remove('is-theatre');
		document.documentElement.classList.remove('pd-lights-out');
		document.body.style.overflow = '';
		home.parentNode?.insertBefore(deck, home);
		home.remove();

		if (blackout) {
			blackout.classList.remove('is-on');
			window.setTimeout(() => {
				if (!theatre) blackout.hidden = true;
			}, 480);
		}
		lightsBtn?.setAttribute('aria-pressed', 'false');
		if (lightsTxt) lightsTxt.textContent = 'Kill the lights';
		deck.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
	};

	prev?.addEventListener('click', () => go(-1));
	next?.addEventListener('click', () => go(1));
	dots.forEach((d, k) =>
		d.addEventListener('click', () => {
			show(k, k > i ? 1 : -1);
			if (playing) arm();
		})
	);
	playBtn?.addEventListener('click', () => setPlaying(!playing));
	lightsBtn?.addEventListener('click', () => (theatre ? lightsOn() : lightsOut()));
	exitBtn?.addEventListener('click', lightsOn);
	blackout?.addEventListener('click', lightsOn);

	// arrows work whenever the stage has focus, or always with the lights out
	document.addEventListener('keydown', (e) => {
		const within = theatre || deck.contains(document.activeElement);
		if (!within) return;
		if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
		else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
		else if (e.key === 'Escape' && theatre) { e.preventDefault(); lightsOn(); }
		else if (e.key === ' ' && theatre) { e.preventDefault(); setPlaying(!playing); }
	});

	// swipe
	let x0 = 0;
	let y0 = 0;
	stage?.addEventListener(
		'touchstart',
		(e) => {
			x0 = e.touches[0].clientX;
			y0 = e.touches[0].clientY;
		},
		{ passive: true }
	);
	stage?.addEventListener(
		'touchend',
		(e) => {
			const dx = e.changedTouches[0].clientX - x0;
			const dy = e.changedTouches[0].clientY - y0;
			if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
		},
		{ passive: true }
	);

	// a deck nobody is looking at should not be flipping
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((en) => {
					if (!en.isIntersecting && playing && !theatre) setPlaying(false);
				});
			},
			{ threshold: 0.2 }
		);
		io.observe(deck);
	}

	// leaving the page (Swup) must not strand the site in the dark
	window.addEventListener('swizel:beforeleave', lightsOn);
	document.addEventListener('swup:willReplaceContent' as never, lightsOn as never);

	show(0, 1);
}
