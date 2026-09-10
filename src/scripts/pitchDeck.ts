// The pitch deck's projectionist.
//
// Raises the curtain, runs the slides (clicker, arrow keys, swipe, autoplay),
// answers questions from the floor, and takes the whole thing full screen
// with the site blacked out behind it.

interface QA {
	q: string;
	k: string[];
	a: string;
}

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
	const openBtn = deck.querySelector<HTMLButtonElement>('[data-pd-open]');
	const curtain = deck.querySelector<HTMLElement>('[data-pd-curtain]');
	const blackout = document.querySelector<HTMLElement>('[data-pd-blackout]');

	// ── the Q&A ──
	const qaEl = deck.querySelector<HTMLElement>('[data-pd-qa]');
	let qa: QA[] = [];
	try {
		qa = qaEl ? (JSON.parse(qaEl.textContent || '[]') as QA[]) : [];
	} catch {
		qa = [];
	}
	const answer = deck.querySelector<HTMLElement>('[data-pd-answer]');
	const answerQ = deck.querySelector<HTMLElement>('[data-pd-answer-q]');
	const answerA = deck.querySelector<HTMLElement>('[data-pd-answer-a]');
	const answerX = deck.querySelector<HTMLButtonElement>('[data-pd-answer-close]');
	const qaForm = deck.querySelector<HTMLFormElement>('[data-pd-qa-form]');
	const qaInput = deck.querySelector<HTMLInputElement>('[data-pd-qa-input]');

	// the blackout must be a child of <body>: a transformed ancestor would
	// turn its `position: fixed` into something stuck inside a section
	if (blackout && blackout.parentElement !== document.body) {
		document.body.appendChild(blackout);
	}

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const total = slides.length;
	let i = 0;
	let timer = 0;
	let curtainTimer = 0;
	let playing = false;
	let theatre = false;
	let opened = false;

	const home = document.createElement('div');
	home.className = 'pdeck-hole';

	// ── slides ────────────────────────────────────────────────────
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
		hideAnswer();
		show(i + d, d);
		if (playing) arm();
	};

	const arm = () => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			if (!playing) return;
			show(i + 1, 1);
			arm();
		}, 6800);
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

	// ── the curtain ───────────────────────────────────────────────
	const raise = () => {
		if (opened) return;
		opened = true;
		window.clearTimeout(curtainTimer);
		deck.classList.add('is-open');
		// the curtain takes about a second; the deck starts running behind it
		// the panels stay hung at the edges, so the element is never removed —
		// `.is-open` is what stops it taking clicks
		window.setTimeout(() => {
			if (!reduce) setPlaying(true);
		}, reduce ? 0 : 1150);
	};

	openBtn?.addEventListener('click', raise);
	// it opens by itself a beat after it comes into view
	if ('IntersectionObserver' in window && curtain) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((en) => {
					if (en.isIntersecting && !opened) {
						curtainTimer = window.setTimeout(raise, 1600);
						io.disconnect();
					}
				});
			},
			{ threshold: 0.35 }
		);
		io.observe(deck);
	} else {
		raise();
	}

	// ── questions from the floor ──────────────────────────────────
	const showAnswer = (q: string, a: string) => {
		if (!answer) return;
		if (answerQ) answerQ.textContent = q;
		if (answerA) answerA.textContent = a;
		answer.hidden = false;
		setPlaying(false);
	};
	const hideAnswer = () => {
		if (answer) answer.hidden = true;
	};

	deck.querySelectorAll<HTMLButtonElement>('[data-pd-ask]').forEach((b) => {
		b.addEventListener('click', () => {
			const item = qa[Number(b.dataset.pdAsk || '0')];
			if (item) showAnswer(item.q, item.a);
		});
	});
	answerX?.addEventListener('click', hideAnswer);

	/** Score every canned answer against what was typed and take the best. */
	const match = (text: string): QA | null => {
		const t = text.toLowerCase();
		let best: QA | null = null;
		let bestScore = 0;
		qa.forEach((item) => {
			let score = 0;
			item.k.forEach((k) => {
				if (t.includes(k)) score += k.length > 4 ? 2 : 1;
			});
			if (score > bestScore) {
				bestScore = score;
				best = item;
			}
		});
		return bestScore >= 2 ? best : null;
	};

	qaForm?.addEventListener('submit', (e) => {
		e.preventDefault();
		const text = (qaInput?.value || '').trim();
		if (!text) return;
		const hit = match(text);
		if (hit) {
			showAnswer(text, hit.a);
		} else {
			showAnswer(
				text,
				'That one deserves a real answer rather than a canned one. Send it to us and a senior builder — not a sales desk — replies within one business day. Most first questions turn into a fifteen-minute call and a fixed quote.'
			);
		}
		if (qaInput) qaInput.blur();
	});

	// ── full screen ───────────────────────────────────────────────
	const lightsOut = () => {
		if (theatre) return;
		theatre = true;
		raise();

		home.style.height = deck.getBoundingClientRect().height + 'px';
		deck.parentNode?.insertBefore(home, deck);
		document.body.appendChild(deck);

		deck.classList.add('is-theatre');
		document.documentElement.classList.add('pd-lights-out');
		document.body.style.overflow = 'hidden';
		if (blackout) {
			blackout.hidden = false;
			requestAnimationFrame(() => blackout.classList.add('is-on'));
		}
		lightsBtn?.setAttribute('aria-pressed', 'true');
		if (lightsTxt) lightsTxt.textContent = 'Lights on';
		stage?.focus();
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
			hideAnswer();
			show(k, k > i ? 1 : -1);
			if (playing) arm();
		})
	);
	playBtn?.addEventListener('click', () => {
		raise();
		setPlaying(!playing);
	});
	lightsBtn?.addEventListener('click', () => (theatre ? lightsOn() : lightsOut()));
	exitBtn?.addEventListener('click', lightsOn);
	blackout?.addEventListener('click', lightsOn);

	document.addEventListener('keydown', (e) => {
		const within = theatre || deck.contains(document.activeElement);
		if (!within) return;
		const typing = document.activeElement === qaInput;
		if (typing && e.key !== 'Escape') return;
		if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
		else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
		else if (e.key === 'Escape') {
			if (answer && !answer.hidden) { hideAnswer(); return; }
			if (theatre) { e.preventDefault(); lightsOn(); }
		} else if (e.key === ' ' && theatre) { e.preventDefault(); setPlaying(!playing); }
	});

	// swipe
	let x0 = 0;
	let y0 = 0;
	stage?.addEventListener(
		'touchstart',
		(e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; },
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

	window.addEventListener('swizel:beforeleave', lightsOn);

	show(0, 1);
}
