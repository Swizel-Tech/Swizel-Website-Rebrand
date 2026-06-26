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
		if (hasAnswers) {
			const card = cards.find((c) => c.dataset.viewId === best);
			const name =
				card?.querySelector('.vo__card-name')?.textContent || 'Boardroom';
			if (recName) recName.textContent = name;
			if (recKicker) recKicker.textContent = 'Recommendation';
			if (recTitle)
				recTitle.firstChild &&
					(recTitle.childNodes[0].nodeValue = 'We think you fit best in ');
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

	const open = (atResults = false) => {
		root.dataset.open = 'true';
		root.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		if (atResults) {
			recommend();
			show('results');
		} else {
			show('intro');
		}
	};

	const close = () => {
		root.dataset.open = 'false';
		root.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		try {
			localStorage.setItem(ONBOARDED_KEY, '1');
		} catch (e) {}
	};

	const goNextAfter = (qStep: string) => {
		const idx = order.indexOf(qStep);
		const next = order[idx + 1];
		if (next === 'results') recommend();
		show(next);
	};

	const goBack = () => {
		const idx = order.indexOf(current());
		if (idx > 0) show(order[idx - 1], 'back');
	};

	// wire controls
	root
		.querySelector('[data-vo-start]')
		?.addEventListener('click', () => show(order[1]));
	root.querySelector('[data-vo-explore]')?.addEventListener('click', () => {
		answers = {};
		root
			.querySelectorAll('.vo__opt.is-selected')
			.forEach((o) => o.classList.remove('is-selected'));
		recommend();
		show('results');
	});
	root
		.querySelector('[data-vo-skip]')
		?.addEventListener('click', () => close());
	root.querySelector('.vo__scrim')?.addEventListener('click', () => close());
	root
		.querySelectorAll('[data-vo-back]')
		.forEach((b) => b.addEventListener('click', () => goBack()));

	root.querySelectorAll<HTMLButtonElement>('.vo__opt').forEach((opt) => {
		opt.addEventListener('click', () => {
			const q = opt.dataset.q || '0';
			try {
				answers[q] = JSON.parse(opt.dataset.scores || '{}') as Scores;
			} catch (e) {}
			// mark the choice (visible when revisiting via back)
			opt
				.closest('.vo__options')
				?.querySelectorAll('.vo__opt')
				.forEach((o) => o.classList.remove('is-selected'));
			opt.classList.add('is-selected');
			// brief pause so the check animation reads, then advance
			window.setTimeout(() => goNextAfter(`q${q}`), 220);
		});
	});

	cards.forEach((card) => {
		card.addEventListener('click', () => {
			const id = card.dataset.viewId;
			if (id) applyView(id);
			close();
			// The view "worlds" only render on the home page. If a world is
			// picked from another page (e.g. /about), go home so it shows.
			// Click a real link so swup intercepts it and plays the page
			// transition (version-proof — no swup API call needed).
			if (id && window.location.pathname !== '/') {
				const a = document.createElement('a');
				a.href = '/';
				a.style.display = 'none';
				document.body.appendChild(a);
				a.click();
				a.remove();
			}
		});
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && root.dataset.open === 'true') close();
	});

	// expose for the nav "switch view" control
	(window as any).openViewPicker = () => open(true);
	document
		.querySelectorAll('[data-open-views]')
		.forEach((b) => b.addEventListener('click', () => open(true)));

	// auto-open for first-time visitors
	let onboarded = false;
	try {
		onboarded = !!localStorage.getItem(ONBOARDED_KEY);
	} catch (e) {}
	if (!onboarded) {
		// slight delay so the page paints first
		window.setTimeout(() => open(false), 650);
	}
}
