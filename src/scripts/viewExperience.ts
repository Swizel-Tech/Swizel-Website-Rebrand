// Multi-view experience: gamified onboarding (welcome pitch + 2 questions)
// and view switching. Theme (light/dark) and view are independent, both persisted.

type Scores = Record<string, number>;

const VIEW_KEY = 'swizel-view';
const ONBOARDED_KEY = 'swizel-onboarded';

const recommendableOrder = [
	'builder',
	'boardroom',
	'founder',
	'campus',
	'studio',
];

export function applyView(id: string) {
	document.documentElement.setAttribute('data-view', id);
	try {
		localStorage.setItem(VIEW_KEY, id);
		localStorage.setItem(ONBOARDED_KEY, '1');
		// Choosing a world by hand makes "the world you came from" stale:
		// Programs would otherwise still offer a door back to somewhere you
		// left ages ago. See scripts/programsNotice.ts.
		sessionStorage.removeItem('swizel-came-from');
	} catch (e) {}
	// Switching worlds should always land you at the top, so the new view is
	// seen from its hero rather than wherever you happened to be scrolled.
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
	window.dispatchEvent(new CustomEvent('swizel:viewchange', { detail: id }));
}

export function initViewExperience() {
	const root = document.getElementById('view-onboarding');
	if (!root) return;

	const steps = Array.from(root.querySelectorAll<HTMLElement>('.vo__step'));
	const bar = root.querySelector<HTMLElement>('#vo-bar');
	const recName = root.querySelector<HTMLElement>('#vo-rec-name');
	const recKicker = root.querySelector<HTMLElement>('#vo-rec-kicker');

	/**
	 * Put the world the visitor is already in at the front of the grid and
	 * mark it, so the answer to "where am I?" is the first thing read
	 * rather than something to be hunted for in the middle of six boxes.
	 *
	 * The attribute is written on load from the stored choice, and the
	 * choice is only ever written by applyView — so its absence means
	 * "has not picked a world yet", which is the first run. On that run
	 * nothing is marked, because telling somebody they are standing in
	 * Boardroom before they have chosen anything, on the same screen that
	 * recommends Boardroom to them, is two contradictory claims at once.
	 */
	const markHere = () => {
		root.querySelectorAll('.vo__card.is-here').forEach((c) => c.classList.remove('is-here'));

		const id = document.documentElement.getAttribute('data-view');
		if (!id) return;

		const card = root.querySelector<HTMLElement>(`.vo__card[data-view-id="${id}"]`);
		if (!card?.parentElement) return;

		card.classList.add('is-here');
		card.parentElement.prepend(card);
	};
	const recTitle = recName?.closest('.vo__title') as HTMLElement | null;
	const cards = Array.from(
		root.querySelectorAll<HTMLButtonElement>('.vo__card')
	);

	// step order built from DOM: intro, q0, q1, results
	const order = steps.map((s) => s.dataset.step || '');
	// one answer per question; re-answering overwrites (no double counting)
	let answers: Record<string, Scores> = {};

	const totalScores = (): Scores => {
		const sum: Scores = {};
		Object.values(answers).forEach((s) =>
			Object.entries(s).forEach(([k, v]) => {
				sum[k] = (sum[k] || 0) + v;
			})
		);
		return sum;
	};

	const setBar = (stepName: string) => {
		if (!bar) return;
		const idx = order.indexOf(stepName);
		const pct =
			stepName === 'intro'
				? 0
				: Math.round((idx / (order.length - 1)) * 100);
		bar.style.width = pct + '%';
	};

	const show = (stepName: string, dir: 'fwd' | 'back' = 'fwd') => {
		steps.forEach((s) => {
			const active = s.dataset.step === stepName;
			s.classList.toggle('is-active', active);
			s.classList.toggle('is-back', active && dir === 'back');
		});
		setBar(stepName);
		root.querySelector('.vo__panel')?.scrollTo({ top: 0 });
	};

	const current = () =>
		steps.find((s) => s.classList.contains('is-active'))?.dataset.step ||
		'intro';

	// what the last run of recommend() landed on, so the countdown and the
	// copy beside it do not have to work it out a second time
	let recommendedId = '';
	let recommendedName = '';

	const recommend = () => {
		const scores = totalScores();
		let best = recommendableOrder[0];
		let bestScore = -1;
		recommendableOrder.forEach((v) => {
			const s = scores[v] || 0;
			if (s > bestScore) {
				bestScore = s;
				best = v;
			}
		});
		const hasAnswers = Object.keys(answers).length > 0 && bestScore > 0;
		cards.forEach((c) =>
			c.classList.toggle(
				'is-recommended',
				hasAnswers && c.dataset.viewId === best
			)
		);
		recommendedId = hasAnswers ? best : '';
		recommendedName = '';
		if (hasAnswers) {
			const card = cards.find((c) => c.dataset.viewId === best);
			const name =
				card?.querySelector('.vo__card-name')?.textContent || 'Boardroom';
			recommendedName = name;
			if (recName) recName.textContent = name;
			if (recKicker) recKicker.textContent = 'Recommendation';
			if (recTitle)
				recTitle.firstChild &&
					(recTitle.childNodes[0]!.nodeValue = 'We think you fit best in ');
			// float the recommended card to the front
			if (card && card.parentElement) {
				card.parentElement.prepend(card);
			}
		} else {
			if (recKicker) recKicker.textContent = 'All views';
			if (recName) recName.textContent = 'your way';
			if (recTitle)
				recTitle.childNodes[0] &&
					(recTitle.childNodes[0].nodeValue = 'Explore Swizel ');
		}
	};

	// ── entering on a countdown ────────────────────────────────────────
	// The brief was "they answer the two questions and enter the site", so
	// the second answer is the last thing anybody has to press. The ring
	// shows exactly how long they have, and reaching for the grid — or the
	// Back button, or Escape — cancels it, so nobody is dragged anywhere
	// while they are still reading.
	const AUTO_MS = 3400;
	const autoBox = root.querySelector<HTMLElement>('.vo__auto');
	const autoName = root.querySelector<HTMLElement>('.vo__auto-name');
	let autoTimer = 0;
	let autoTarget = '';

	const cancelAutoEnter = () => {
		if (autoTimer) window.clearTimeout(autoTimer);
		autoTimer = 0;
		autoTarget = '';
		if (autoBox) autoBox.dataset.on = 'false';
	};

	const startAutoEnter = () => {
		cancelAutoEnter();
		if (!autoBox || !recommendedId) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		autoTarget = recommendedId;
		if (autoName) autoName.textContent = recommendedName || 'Boardroom';
		autoBox.style.setProperty('--auto-ms', `${AUTO_MS}ms`);
		// a reflow between off and on, or the ring's animation does not
		// restart when the quiz is retaken
		autoBox.dataset.on = 'false';
		void autoBox.offsetWidth;
		autoBox.dataset.on = 'true';
		autoTimer = window.setTimeout(() => {
			autoTimer = 0;
			const id = autoTarget;
			cancelAutoEnter();
			if (id) enterView(id);
		}, AUTO_MS);
	};

	const open = (atResults = false) => {
		cancelAutoEnter();
		root.dataset.open = 'true';
		root.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		// same house rules as the film: park the floating furniture and wear
		// the Swizel mark as the pointer
		document.documentElement.classList.add('wf-open');
		markHere();
		if (atResults) {
			recommend();
			show('results');
		} else {
			show('intro');
		}
	};

	const close = () => {
		cancelAutoEnter();
		root.dataset.open = 'false';
		root.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		document.documentElement.classList.remove('wf-open');
		try {
			localStorage.setItem(ONBOARDED_KEY, '1');
		} catch (e) {}
	};

	/**
	 * Walk into a world: set it, shut the modal, and make sure the worlds
	 * are actually on screen — they only render on the home page, so a
	 * choice made from /about has to go home to be seen.
	 *
	 * Both doors into a view use this: clicking a card, and letting the
	 * countdown run out.
	 */
	const enterView = (rawId: string) => {
		let id: string | undefined = rawId;
		// "Surprise me" — roll a random world (never the one you're in)
		if (id === 'surprise') {
			const here =
				document.documentElement.getAttribute('data-view') || 'boardroom';
			const pool = recommendableOrder.filter((v) => v !== here);
			id = pool[Math.floor(Math.random() * pool.length)];
		}
		if (id) applyView(id);
		close();
		if (id && window.location.pathname !== '/') {
			// Click a real link so swup intercepts it and plays the page
			// transition (version-proof — no swup API call needed).
			const a = document.createElement('a');
			a.href = '/';
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
	};

	const goNextAfter = (qStep: string) => {
		const idx = order.indexOf(qStep);
		const next = order[idx + 1];
		if (!next) return;
		if (next === 'results') recommend();
		show(next);
		// the last answer is the whole ask: "answer the two questions and
		// enter the site". So it does, unless they say otherwise.
		if (next === 'results') startAutoEnter();
	};

	const goBack = () => {
		cancelAutoEnter();
		const idx = order.indexOf(current());
		// Back from the first question returns to the chooser it came from.
		// It used to start the full thirty-three second film, which is a
		// remarkable thing for a Back button to do.
		if (idx <= 1) {
			close();
			const chooser =
				(window as any).openWelcomeChooser || (window as any).openWelcomeFilm;
			if (typeof chooser === 'function') chooser();
			else show(order[0] ?? 'intro', 'back');
			return;
		}
		show(order[idx - 1] ?? 'intro', 'back');
	};

	// wire controls
	root
		.querySelector('[data-vo-start]')
		?.addEventListener('click', () => show(order[1] ?? 'intro'));
	root.querySelector('[data-vo-explore]')?.addEventListener('click', () => {
		answers = {};
		root
			.querySelectorAll('.vo__opt.is-selected')
			.forEach((o) => o.classList.remove('is-selected'));
		recommend();
		show('results');
	});
	root
		.querySelectorAll('[data-vo-skip]')
		.forEach((b) => b.addEventListener('click', () => close()));
	// Links inside the modal ("Start a project") navigate via swup behind the
	// overlay — close the modal (and release the body scroll lock) so the
	// navigation is actually seen instead of looking like a dead click.
	root
		.querySelectorAll<HTMLAnchorElement>('a[href]')
		.forEach((a) => a.addEventListener('click', () => close()));
	root.querySelector('.vo__scrim')?.addEventListener('click', () => close());
	root
		.querySelectorAll('[data-vo-back]')
		.forEach((b) => b.addEventListener('click', () => goBack()));

	// a ring of the answer's own colour, thrown from where it was clicked
	const ripple = root.querySelector<HTMLElement>('.vo__ripple');
	const panel = root.querySelector<HTMLElement>('.vo__panel');
	const throwRipple = (from: HTMLElement, hue: string) => {
		if (!ripple || !panel) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const p = panel.getBoundingClientRect();
		const r = from.getBoundingClientRect();
		ripple.style.setProperty('--rx', `${r.left - p.left + r.width / 2}px`);
		ripple.style.setProperty('--ry', `${r.top - p.top + r.height / 2}px`);
		ripple.style.setProperty('--rhue', hue || 'var(--vo-acc)');
		ripple.dataset.on = 'false';
		void ripple.offsetWidth;
		ripple.dataset.on = 'true';
	};

	// how long the choice is allowed to be admired before the step turns.
	// Long enough for the stamp to land and the siblings to stand down
	// (0.5s and 0.42s), short enough that it never feels like a wait.
	const PICK_HOLD = 560;

	root.querySelectorAll<HTMLButtonElement>('.vo__opt').forEach((opt) => {
		opt.addEventListener('click', () => {
			const group = opt.closest<HTMLElement>('.vo__options');
			// a second click while the first is still playing out would
			// double-advance; the lock closes that door
			if (group?.classList.contains('is-locked')) return;
			const q = opt.dataset.q || '0';
			try {
				answers[q] = JSON.parse(opt.dataset.scores || '{}') as Scores;
			} catch (e) {}
			// mark the choice (visible when revisiting via back)
			group?.querySelectorAll('.vo__opt').forEach((o) => {
				o.classList.remove('is-selected', 'is-picked');
			});
			opt.classList.add('is-selected', 'is-picked');
			group?.classList.add('is-locked');
			throwRipple(opt, opt.style.getPropertyValue('--hue').trim());
			window.setTimeout(() => {
				// hand the step back before leaving it, so coming back via
				// Back finds a live question rather than a frozen one
				group?.classList.remove('is-locked');
				opt.classList.remove('is-picked');
				goNextAfter(`q${q}`);
			}, PICK_HOLD);
		});
	});

	cards.forEach((card) => {
		// reaching for the grid at all means they want to choose for
		// themselves — stop the countdown on the way down, before the
		// click even completes
		card.addEventListener('pointerdown', cancelAutoEnter);
		card.addEventListener('click', () => {
			cancelAutoEnter();
			const id = card.dataset.viewId;
			if (id) enterView(id);
		});
	});

	root
		.querySelectorAll('[data-vo-stay]')
		.forEach((b) => b.addEventListener('click', () => cancelAutoEnter()));
	// scrolling the result list is reading, not deciding
	root
		.querySelector('.vo__panel')
		?.addEventListener('wheel', cancelAutoEnter, { passive: true });
	root
		.querySelector('.vo__panel')
		?.addEventListener('touchmove', cancelAutoEnter, { passive: true });

	document.addEventListener('keydown', (e) => {
		if (root.dataset.open !== 'true') return;
		// any key at all stops the clock; Escape also shuts the modal
		cancelAutoEnter();
		if (e.key === 'Escape') close();
	});

	// expose for the nav "switch view" control
	(window as any).openViewPicker = () => open(true);
	// The welcome film owns the first visit now; its "Make it mine" button
	// drops people straight into the questions, skipping the old text intro
	// (nobody should have to read a pitch before they know who we are).
	(window as any).openViewQuiz = () => {
		answers = {};
		root
			.querySelectorAll('.vo__opt.is-selected')
			.forEach((o) => o.classList.remove('is-selected'));
		open(false);
		show(order[1] || 'intro');
	};
	document
		.querySelectorAll('[data-open-views]')
		.forEach((b) => b.addEventListener('click', () => open(true)));
}
