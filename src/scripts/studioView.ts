import { openTourChooser, siteLegs, type TourStep } from './tour';

export function initStudioView() {
	const hero = document.querySelector<HTMLElement>('[data-shr]');

	if (hero) {
		const wall = hero.querySelector<HTMLElement>('[data-shr-wall]');
		const frame = hero.querySelector<HTMLElement>('.shr-hero-frame');
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');

		// ── the room takes its colour from whatever you are looking at ──
		const swatches = Array.from(
			hero.querySelectorAll<HTMLButtonElement>('[data-shr-palette] [data-shr-tint]')
		);
		let held = swatches[0]?.dataset.shrTint || '#ec4899';

		const tint = (hex: string) => hero.style.setProperty('--sa', hex);

		// the swatch's name and hex are read out in the label above the
		// rail rather than printed inside the chip, where they sat on top
		// of the colour they were describing
		const nameEl = hero.querySelector<HTMLElement>('[data-shr-swatch-name]');
		const hexEl = hero.querySelector<HTMLElement>('[data-shr-swatch-hex]');
		const say = (sw: HTMLElement) => {
			const [name, hex] = (sw.getAttribute('aria-label') || '').split(/\s(?=#)/);
			if (nameEl && name) nameEl.textContent = name;
			if (hexEl && hex) hexEl.textContent = hex;
		};

		swatches.forEach((sw) => {
			sw.addEventListener('click', () => {
				held = sw.dataset.shrTint || held;
				swatches.forEach((o) => o.classList.toggle('is-on', o === sw));
				say(sw);
				tint(held);
			});
			sw.addEventListener('pointerenter', () => {
				say(sw);
				tint(sw.dataset.shrTint || held);
			});
			sw.addEventListener('pointerleave', () => {
				const on = swatches.find((o) => o.classList.contains('is-on'));
				if (on) say(on);
				tint(held);
			});
		});

		// hovering a hung piece borrows its colour; leaving gives it back
		hero.querySelectorAll<HTMLElement>('.shr-hung').forEach((art) => {
			const c = art.dataset.shrTint;
			if (!c) return;
			const take = () => tint(c);
			const give = () => tint(held);
			art.addEventListener('pointerenter', take);
			art.addEventListener('focus', take);
			art.addEventListener('pointerleave', give);
			art.addEventListener('blur', give);
		});

		// ── the spotlight and the parallax ──────────────────────────
		// One pointermove, one rAF, three writes. The wall's pieces read
		// --px/--py and multiply by their own depth in CSS, so the further
		// a piece hangs the further it swims — no per-element maths here.
		if (!still.matches) {
			let raf = 0;
			let px = 0;
			let py = 0;
			let mx = 60;
			let my = 34;

			const paint = () => {
				raf = 0;
				hero.style.setProperty('--mx', `${mx}%`);
				hero.style.setProperty('--my', `${my}%`);
				if (wall) {
					wall.style.setProperty('--px', `${px.toFixed(2)}px`);
					wall.style.setProperty('--py', `${py.toFixed(2)}px`);
				}
				if (frame) {
					frame.style.setProperty('--ry', `${(px * 0.28).toFixed(2)}deg`);
					frame.style.setProperty('--rx', `${(-py * 0.3).toFixed(2)}deg`);
				}
			};

			hero.addEventListener('pointermove', (e) => {
				if (e.pointerType === 'touch') return;
				const r = hero.getBoundingClientRect();
				const nx = (e.clientX - r.left) / r.width;
				const ny = (e.clientY - r.top) / r.height;
				mx = nx * 100;
				my = ny * 100;
				px = (nx - 0.5) * -14;
				py = (ny - 0.5) * -10;
				if (!raf) raf = requestAnimationFrame(paint);
			});

			hero.addEventListener('pointerleave', () => {
				mx = 60;
				my = 34;
				px = 0;
				py = 0;
				if (!raf) raf = requestAnimationFrame(paint);
			});
		}
	}

	// the tour walks the whole studio world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-studio .shr-head',
			title: 'Private view',
			body: 'You imagine it. We design, build, film and launch it — and it ends up on this wall.',
		},
		{
			sel: '#studio-gallery .shr-hero-frame',
			title: 'The studio reel',
			body: 'A year of work in ninety seconds. It runs on its own — press anywhere on it to take control.',
		},
		{
			sel: '#studio-gallery .shr-hung--a',
			title: 'Six pieces, hung',
			body: 'Real client work, each in its own frame. Touch one and the whole room takes its colour.',
		},
		{
			sel: '.hero-studio .shr-palette',
			title: 'The palette',
			body: 'Five house colours. Pick one and the gallery is repainted around you.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Five worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '.sd-atrium .sd-centerpiece',
			title: 'The atrium',
			body: 'Welcome to The Swizel Gallery — Vol. on view now. A studio whose work lives in the real world.',
		},
		{
			sel: '#sd-work',
			title: 'The Collection',
			body: 'Every piece on the wall, labelled like a museum. Click any work to visit it live.',
		},
		{
			sel: '.sd-exhibit',
			title: 'Featured exhibitions',
			body: 'The big rooms — full case studies of the brands we built end to end.',
		},
		{
			sel: '.sd-craft',
			title: 'The crafts',
			body: 'Branding, UI/UX, web & mobile, motion — what the studio is commissioned for.',
		},
		{
			sel: '.sd-sheet',
			title: 'Behind the glass',
			body: 'A taped contact sheet: research, concept, craft, ship. How a piece gets made.',
		},
		{
			sel: '#sd-pull',
			title: 'In their words',
			body: 'Real clients, set in serif italic. Quiet confidence, on rotation.',
		},
		{
			sel: '.sd-cta',
			title: 'Commission us',
			body: 'Your brand deserves better clothes. Commission the studio, or call directly.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates and behind the scenes — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="studio"]')
		.forEach((b) => b.addEventListener('click', () => openTourChooser(steps, siteLegs(steps))));
}
