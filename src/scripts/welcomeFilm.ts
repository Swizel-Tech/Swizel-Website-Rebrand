// Welcome film — the first-visit opener.
//
// It runs in one of two MODES.
//
//   overture · what a first visit actually gets. The velvet parts, the name
//              lands, "You imagine. We build." holds for a beat, and the
//              choices are on screen inside six seconds. Nobody is made to
//              sit through a company film to reach a website.
//
//   film     · the full seven scene reel, about thirty-three seconds. This is
//              now opt-in: asked for from the chooser, from the views modal,
//              or from anything wearing [data-open-film].
//
// Under the reel is a tiny timeline engine: scenes are declared with a start
// time, the clock is driven by rAF (so it pauses honestly when the tab is
// hidden), and each scene is just a DOM layer whose CSS animations run when it
// gets `.is-on`. The overture does not need the clock at all — one scene, one
// timeout — so it never starts it.
//
// Skip, at any point and in either mode, means the same thing: close the
// house and put them on the default screen, at the top. It never dumps them
// on the chooser, which is what it used to do.

const ONBOARDED_KEY = 'swizel-onboarded';
const AUDIO_SRC = '/audio/welcome.mp3';

type Mode = 'overture' | 'film';
type Scene = { id: string; at: number };

// start times in ms; the last entry is the end card
const SCENES: Scene[] = [
	{ id: '0', at: 0 }, // welcome + the verbs
	{ id: '1', at: 5400 }, // who we are
	{ id: '2', at: 9400 }, // where we are
	{ id: '3', at: 13800 }, // what we do + what we build
	{ id: '4', at: 19400 }, // the receipts
	{ id: '5', at: 24600 }, // the people
	{ id: '6', at: 28400 }, // the twist
	{ id: 'end', at: 32600 },
];
const LAST = SCENES[SCENES.length - 1] as Scene;
const DURATION = LAST.at;
// how long the house takes before the first frame: marquee card, then velvet
const CURTAIN_HOLD = 1900;
const CURTAIN_PART = 150;
// The overture's own, shorter clock. The marquee card is a flash of the name
// rather than a wait, and the scene itself has every animation finished by
// 2.6s — the rest is a hold on a finished frame, which reads as composure
// instead of dead air.
const OV_HOLD = 950;
const OV_RUN = 4300;

export function initWelcomeFilm() {
	const root = document.getElementById('welcome-film');
	if (!root) return;
	// the film lives inside #swup, so a swup swap hands us a fresh node —
	// guard per element, not per window
	if (root.dataset.bound === 'true') return;
	root.dataset.bound = 'true';

	const stage = root.querySelector<HTMLElement>('#wf-stage');
	const bar = root.querySelector<HTMLElement>('#wf-bar');
	const replayBtn = root.querySelector<HTMLButtonElement>('#wf-replay');
	const soundBtn = root.querySelector<HTMLButtonElement>('#wf-sound');
	const audio = root.querySelector<HTMLAudioElement>('#wf-audio');
	const scenes = Array.from(root.querySelectorAll<HTMLElement>('.wf-scene'));
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let raf = 0;
	let lastTick = 0;
	let elapsed = 0;
	let playing = false;
	let currentId = '';
	let rate = 1;
	let mode: Mode = 'film';
	// every timeout the house owns, so a mode change can cancel the one
	// still in flight rather than have it fire into the new mode
	let timers: number[] = [];
	const RATES = [1, 1.5, 2, 0.5];

	const after = (ms: number, fn: () => void) => {
		timers.push(window.setTimeout(fn, ms));
	};
	const clearTimers = () => {
		timers.forEach((t) => window.clearTimeout(t));
		timers = [];
	};
	const setMode = (m: Mode) => {
		mode = m;
		root.dataset.mode = m;
	};

	const sceneEl = (id: string) => scenes.find((s) => s.dataset.scene === id);

	const showScene = (id: string) => {
		if (id === currentId) return;
		const isCut = currentId !== '';
		currentId = id;
		scenes.forEach((s) => {
			const on = s.dataset.scene === id;
			s.classList.toggle('is-on', on);
			s.setAttribute('aria-hidden', on ? 'false' : 'true');
		});
		// the projector blinks on every cut
		if (isCut && stage && !reduce) {
			stage.classList.remove('is-flash');
			void stage.offsetWidth;
			stage.classList.add('is-flash');
		}
		if (id === '4') runCounters(sceneEl('4'));
	};

	// the proof scene's numbers spin up as it lands
	const runCounters = (el?: HTMLElement | null) => {
		if (!el) return;
		el.querySelectorAll<HTMLElement>('[data-wf-count]').forEach((n) => {
			const to = Number(n.dataset.wfCount || '0');
			const suffix = n.dataset.suffix || '';
			if (reduce) {
				n.textContent = `${to}${suffix}`;
				return;
			}
			const dur = 1300;
			const t0 = performance.now();
			const tick = (t: number) => {
				const p = Math.min(1, (t - t0) / dur);
				const eased = 1 - Math.pow(1 - p, 3);
				n.textContent = `${Math.round(to * eased)}${suffix}`;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
	};

	const setProgress = (ms: number) => {
		const pct = Math.min(100, (ms / DURATION) * 100);
		if (bar) bar.style.width = `${pct}%`;
		const k = root.querySelector<HTMLElement>('#wf-knob');
		if (k) k.style.left = `${pct}%`;
		root.querySelector('#wf-scrub')?.setAttribute('aria-valuenow', String(Math.round(pct)));
	};

	// which scene the clock is currently sitting in
	const sceneAt = (ms: number) => {
		let id = (SCENES[0] as Scene).id;
		for (const s of SCENES) if (ms >= s.at) id = s.id;
		return id;
	};

	const frame = (now: number) => {
		if (!playing) return;
		if (!fpsChecked) watchFps(now);
		const dt = lastTick ? now - lastTick : 0;
		lastTick = now;
		// the clock advances at the chosen speed, so 2x really is twice as fast
		elapsed = Math.min(DURATION, elapsed + dt * rate);
		setProgress(elapsed);
		showScene(sceneAt(elapsed));
		if (elapsed >= DURATION) {
			finish();
			return;
		}
		raf = requestAnimationFrame(frame);
	};

	// ── keep an eye on the frame rate while the reel runs ────────────────
	// Weaker machines (integrated graphics, older laptops) cannot afford the
	// grain, the spotlights and the blurred glows. Rather than guess from the
	// user agent, watch real frames: if we cannot hold ~45fps, drop into lite
	// mode for the rest of the session.
	let fpsFrames = 0;
	let fpsStart = 0;
	let fpsChecked = false;
	const watchFps = (now: number) => {
		if (!fpsStart) fpsStart = now;
		fpsFrames++;
		const span = now - fpsStart;
		if (span < 1200) return;
		fpsChecked = true;
		const fps = (fpsFrames * 1000) / span;
		if (fps < 45) {
			root.dataset.lite = 'true';
			document.documentElement.classList.add('perf-lite');
			try {
				sessionStorage.setItem('swizel-lite', '1');
			} catch (e) {}
		}
	};

	const play = (from?: number) => {
		cancelAnimationFrame(raf);
		if (typeof from === 'number') elapsed = from;
		lastTick = 0;
		playing = true;
		root.dataset.ended = 'false';
		root.dataset.paused = 'false';
		raf = requestAnimationFrame(frame);
	};

	const pause = (byHand = false) => {
		playing = false;
		cancelAnimationFrame(raf);
		lastTick = 0;
		// only say "paused" when a person did it, not when we stop internally
		if (byHand) root.dataset.paused = 'true';
	};

	// move the reel to any point; landing in a scene replays it from its start
	const seek = (ms: number, replay = true) => {
		elapsed = Math.max(0, Math.min(DURATION, ms));
		setProgress(elapsed);
		if (root.dataset.ended === 'true' && elapsed < DURATION) {
			root.dataset.ended = 'false';
			root.querySelector('#wf-finale')?.setAttribute('aria-hidden', 'true');
			if (!reduce) root.dataset.curtain = 'open';
		}
		if (replay) currentId = '';
		showScene(sceneAt(elapsed));
	};

	const finish = () => {
		// an overture timeout may still be in flight (skip, or a replay
		// pressed mid-hold); cancel it so it cannot fire into this state
		clearTimers();
		pause();
		root.dataset.paused = 'false';
		elapsed = DURATION;
		setProgress(DURATION);
		showScene('end');
		// bring the velvet halfway back in and hand the stage to the choices
		if (!reduce) root.dataset.curtain = 'half';
		root.dataset.ended = 'true';
		root.querySelector('#wf-finale')?.setAttribute('aria-hidden', 'false');
		audio?.pause();
	};

	const open = (opts?: { overture?: boolean }) => {
		clearTimers();
		setMode(opts?.overture ? 'overture' : 'film');
		root.dataset.open = 'true';
		root.dataset.curtain = 'shut';
		root.dataset.ended = 'false';
		root.querySelector('#wf-finale')?.setAttribute('aria-hidden', 'true');
		root.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		// park the page's floating furniture (chat bubble, back-to-top) so
		// nothing sits on top of the cinema
		document.documentElement.classList.add('wf-open');
		currentId = '';
		scenes.forEach((s) => s.classList.remove('is-on'));
		root.dataset.paused = 'false';
		rate = 1;
		// one signal for the whole site: the probe in BaseHead and the
		// watchdog in MainLayout both speak through html.perf-lite
		if (document.documentElement.classList.contains('perf-lite')) {
			root.dataset.lite = 'true';
		}
		if (reduce) {
			// no house lights, no film: straight to the choices
			root.dataset.curtain = 'open';
			finish();
			probeAudio();
			return;
		}

		if (mode === 'overture') {
			// a glimpse of the marquee, the velvet goes, the name lands,
			// and then the choices. No clock, no console.
			after(OV_HOLD, () => {
				root.dataset.curtain = 'open';
				showScene('ov');
			});
			after(OV_HOLD + OV_RUN, finish);
			probeAudio();
			return;
		}

		// hold on the marquee card, part the velvet, then roll
		after(CURTAIN_HOLD, () => (root.dataset.curtain = 'open'));
		after(CURTAIN_HOLD + CURTAIN_PART, () => play(0));
		probeAudio();
	};

	const close = () => {
		clearTimers();
		pause();
		audio?.pause();
		root.dataset.open = 'false';
		root.dataset.curtain = 'shut';
		root.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		document.documentElement.classList.remove('wf-open');
		try {
			localStorage.setItem(ONBOARDED_KEY, '1');
		} catch (e) {}
	};

	/**
	 * Skip, from anywhere, in either mode.
	 *
	 * "If the person selects skip at any point, just take them to the default
	 * screen" — so this is deliberately NOT the chooser. It shuts the house
	 * and leaves them at the top of the home page.
	 *
	 * Nothing is written to the view: the ABSENCE of data-view is what the
	 * stylesheet reads as Boardroom, so skipping leaves the default in place
	 * without pretending the visitor chose it. Anyone who had already picked
	 * a world keeps the one they picked.
	 */
	const enterSite = () => {
		close();
		window.scrollTo({ top: 0, behavior: 'auto' });
		if (window.location.pathname !== '/') {
			// a real link, so swup intercepts it and plays the transition
			const a = document.createElement('a');
			a.href = '/';
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
	};

	/**
	 * "Watch the full welcome film" from the chooser.
	 *
	 * The velvet sweeps back in over the choices, the house resets, and the
	 * reel opens on a fresh print — the same entrance the film has always
	 * had, so it never looks like a jump cut from a menu.
	 */
	const playFull = () => {
		clearTimers();
		setMode('film');
		root.dataset.ended = 'false';
		root.querySelector('#wf-finale')?.setAttribute('aria-hidden', 'true');
		currentId = '';
		scenes.forEach((s) => s.classList.remove('is-on'));
		setProgress(0);
		if (reduce) {
			finish();
			return;
		}
		root.dataset.curtain = 'closing';
		after(700, () => (root.dataset.curtain = 'shut'));
		after(1000, () => (root.dataset.curtain = 'open'));
		after(1150, () => play(0));
	};

	// Sound is optional: the button only appears once a real track exists at
	// /audio/welcome.mp3, so nothing is ever wired to a missing file.
	let audioProbed = false;
	const probeAudio = () => {
		if (audioProbed || !audio || !soundBtn) return;
		audioProbed = true;
		fetch(AUDIO_SRC, { method: 'HEAD' })
			.then((r) => {
				if (!r.ok) return;
				audio.src = AUDIO_SRC;
				audio.muted = true;
				soundBtn.hidden = false;
			})
			.catch(() => {});
	};

	soundBtn?.addEventListener('click', () => {
		if (!audio || !audio.src) return;
		const on = audio.muted;
		audio.muted = !on;
		if (on) audio.play().catch(() => {});
		soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
		soundBtn.classList.toggle('is-on', on);
	});

	// tapping the screen pauses/resumes, like any player
	stage?.addEventListener('click', (e) => {
		const t = e.target as HTMLElement;
		if (t.closest('button, a, #wf-scrub')) return;
		// nothing to pause in a four second overture
		if (mode === 'overture') return;
		if (root.dataset.ended === 'true') return;
		if (playing) pause(true);
		else play();
	});

	// ── scrubbing: drag the counter to move the reel ────────────────────
	const scrub = root.querySelector<HTMLElement>('#wf-scrub');
	if (scrub) {
		let dragging = false;
		let resumeAfter = false;
		const msFromX = (x: number) => {
			const r = scrub.getBoundingClientRect();
			return ((x - r.left) / r.width) * DURATION;
		};
		scrub.addEventListener('pointerdown', (e) => {
			if (mode === 'overture') return;
			if (root.dataset.ended === 'true') return;
			dragging = true;
			resumeAfter = playing;
			root.dataset.scrub = 'true';
			scrub.setPointerCapture(e.pointerId);
			pause();
			seek(msFromX(e.clientX), false);
		});
		scrub.addEventListener('pointermove', (e) => {
			if (dragging) seek(msFromX(e.clientX), false);
		});
		const endDrag = () => {
			if (!dragging) return;
			dragging = false;
			root.dataset.scrub = 'false';
			// land properly: replay the scene we stopped in
			seek(elapsed, true);
			if (resumeAfter) play();
			else root.dataset.paused = 'true';
		};
		scrub.addEventListener('pointerup', endDrag);
		scrub.addEventListener('pointercancel', endDrag);
		scrub.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
				e.preventDefault();
				seek(elapsed + (e.key === 'ArrowRight' ? 3000 : -3000));
			}
		});
	}

	// ── speed ───────────────────────────────────────────────────────────
	const rateBtn = root.querySelector<HTMLButtonElement>('#wf-rate');
	rateBtn?.addEventListener('click', () => {
		rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
		rateBtn.textContent = `${rate}\u00d7`;
		rateBtn.setAttribute('aria-label', `Playback speed ${rate} times`);
	});

	// "Watch it again" (out of the reel) and "Watch the full welcome film"
	// (out of the overture) are the same journey, so they are the same code.
	replayBtn?.addEventListener('click', playFull);
	root
		.querySelectorAll('[data-wf-full]')
		.forEach((b) => b.addEventListener('click', playFull));

	// the scene drifts a little under the pointer, so the screen has depth
	if (stage && !reduce && window.matchMedia('(pointer: fine)').matches) {
		stage.addEventListener(
			'pointermove',
			(e) => {
				const r = stage.getBoundingClientRect();
				stage.style.setProperty(
					'--px',
					String(((e.clientX - r.left) / r.width - 0.5).toFixed(3))
				);
				stage.style.setProperty(
					'--py',
					String(((e.clientY - r.top) / r.height - 0.5).toFixed(3))
				);
			},
			{ passive: true }
		);
		stage.addEventListener('pointerleave', () => {
			stage.style.setProperty('--px', '0');
			stage.style.setProperty('--py', '0');
		});
	}

	// Skip means skip. It used to end the reel early and hand over to the
	// chooser, which is the opposite of what somebody pressing Skip is
	// asking for: they want the website, not a different screen.
	root
		.querySelectorAll('[data-wf-skip]')
		.forEach((b) => b.addEventListener('click', enterSite));

	root
		.querySelectorAll('[data-wf-close]')
		.forEach((b) => b.addEventListener('click', enterSite));

	// "Make it mine" → close the film and hand over to the world picker.
	// NOTE: there are two of these (the HUD and the finale), so bind ALL of
	// them — querySelector would silently leave the finale button dead.
	root.querySelectorAll('[data-wf-mine]').forEach((b) =>
		b.addEventListener('click', () => {
			close();
			const openQuiz = (window as any).openViewQuiz;
			if (typeof openQuiz === 'function') openQuiz();
			else (window as any).openViewPicker?.();
		})
	);

	// links inside the film navigate via swup behind the overlay — close first
	root
		.querySelectorAll<HTMLAnchorElement>('a[href]')
		.forEach((a) => a.addEventListener('click', () => close()));

	document.addEventListener('keydown', (e) => {
		if (root.dataset.open !== 'true') return;
		// Escape is the keyboard's Skip, so it goes the same place
		if (e.key === 'Escape') enterSite();
		if (mode === 'overture') return;
		if (e.key === ' ' || e.key === 'Spacebar') {
			e.preventDefault();
			if (root.dataset.ended === 'true') return;
			playing ? pause(true) : play();
		}
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			if (root.dataset.ended === 'true') return;
			e.preventDefault();
			seek(elapsed + (e.key === 'ArrowRight' ? 3000 : -3000));
		}
	});

	// a hidden tab should not burn through the film
	document.addEventListener('visibilitychange', () => {
		if (root.dataset.open !== 'true' || root.dataset.ended === 'true') return;
		if (mode === 'overture') return;
		if (document.hidden) pause();
		else if (!playing && root.dataset.paused !== 'true') play();
	});

	// let anything on the site play the full reel; the overture is only ever
	// the first visit, so it gets its own door and nothing in the UI points
	// at it
	(window as any).openWelcomeFilm = () => open();
	(window as any).openWelcomeOverture = () => open({ overture: true });
	/**
	 * Re-open the house on the chooser, with no film either side of it.
	 *
	 * This is what Back from the first question needs: the screen it came
	 * from. It used to call openWelcomeFilm, which meant backing out of a
	 * question started a thirty-three second reel — the single most
	 * surprising thing a Back button could possibly do.
	 */
	(window as any).openWelcomeChooser = () => {
		clearTimers();
		setMode('overture');
		root.dataset.open = 'true';
		root.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		document.documentElement.classList.add('wf-open');
		currentId = '';
		finish();
	};
	document
		.querySelectorAll('[data-open-film]')
		.forEach((b) => b.addEventListener('click', () => open()));

	// First-time visitors get the overture. 320ms is enough for the page
	// behind it to have painted, so the velvet is drawn over a real site
	// rather than over nothing.
	let onboarded = false;
	try {
		onboarded = !!localStorage.getItem(ONBOARDED_KEY);
	} catch (e) {}
	if (!onboarded) window.setTimeout(() => open({ overture: true }), 320);
}
