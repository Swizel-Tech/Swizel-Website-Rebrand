// Multi-view experience: gamified onboarding quiz + view switching.
// Theme (light/dark) and view are independent, both persisted.

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
	window.dispatchEvent(new CustomEvent('swizel:viewchange', { detail: id }));
}

export function initViewExperience() {
	const root = document.getElementById('view-onboarding');
	if (!root) return;

	const steps = Array.from(
		root.querySelectorAll<HTMLElement>('.vo__step')
	);
	const bar = root.querySelector<HTMLElement>('#vo-bar');
	const recName = root.querySelector<HTMLElement>('#vo-rec-name');
	const recKicker = root.querySelector<HTMLElement>('#vo-rec-kicker');
	const recTitle = recName?.closest('.vo__title') as HTMLElement | null;
	const cards = Array.from(
		root.querySelectorAll<HTMLButtonElement>('.vo__card')
	);

	// step order built from DOM
	const order = steps.map((s) => s.dataset.step || '');
	let scores: Scores = {};

	const setBar = (stepName: string) => {
		if (!bar) return;
		const idx = order.indexOf(stepName);
		const pct =
			stepName === 'intro'
				? 0
				: Math.round((idx / (order.length - 1)) * 100);
		bar.style.width = pct + '%';
	};

	const show = (stepName: string) => {
		steps.forEach((s) =>
			s.classList.toggle('is-active', s.dataset.step === stepName)
		);
		setBar(stepName);
		root.querySelector('.vo__panel')?.scrollTo({ top: 0 });
	};

	const recommend = () => {
		let best = recommendableOrder[0];
		let bestScore = -1;
		recommendableOrder.forEach((v) => {
			const s = scores[v] || 0;
			if (s > bestScore) {
				bestScore = s;
				best = v;
			}
		});
		const hasAnswers = Object.keys(scores).length > 0 && bestScore > 0;
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
			if (recKicker) recKicker.textContent = 'Your match';
			if (recTitle)
				recTitle.firstChild &&
					(recTitle.childNodes[0].nodeValue = "We think you'll love ");
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
			scores = {};
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

	// wire controls
	root
		.querySelector('[data-vo-start]')
		?.addEventListener('click', () => show(order[1]));
	root.querySelector('[data-vo-explore]')?.addEventListener('click', () => {
		scores = {};
		recommend();
		show('results');
	});
	root
		.querySelector('[data-vo-skip]')
		?.addEventListener('click', () => close());
	root
		.querySelector('[data-vo-close]')
		?.addEventListener('click', () => close());

	root.querySelectorAll<HTMLButtonElement>('.vo__opt').forEach((opt) => {
		opt.addEventListener('click', () => {
			try {
				const s = JSON.parse(opt.dataset.scores || '{}') as Scores;
				Object.entries(s).forEach(([k, v]) => {
					scores[k] = (scores[k] || 0) + v;
				});
			} catch (e) {}
			goNextAfter(`q${opt.dataset.q}`);
		});
	});

	cards.forEach((card) => {
		card.addEventListener('click', () => {
			const id = card.dataset.viewId;
			if (id) applyView(id);
			close();
		});
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && root.dataset.open === 'true') close();
	});

	// expose for the nav "switch view" control
	(window as any).openViewPicker = () => open(true);
	document
		.querySelectorAll('[data-open-views]')
		.forEach((b) =>
			b.addEventListener('click', () => open(true))
		);

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
