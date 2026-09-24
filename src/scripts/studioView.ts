import { openTourChooser, siteLegs, type TourStep } from './tour';

export function initStudioView() {
	const hero = document.querySelector<HTMLElement>('[data-shr]');

	if (hero) {
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');

		// ── the wall ────────────────────────────────────────────────
		// Six pieces hang around the reel. One at a time is "lit": it
		// lifts off the wall, comes up to full colour, and hands its
		// colour to the room — orbs, beam, headline word, frames and
		// ticker all read the same variable. It moves along on its own
		// every few seconds, and follows the pointer when there is one.
		const wall = hero.querySelector<HTMLElement>('[data-shr-wall]');
		const arts = Array.from(hero.querySelectorAll<HTMLElement>('[data-shr-art]'));
		const reelMat = hero.querySelector<HTMLElement>('.shr-mat--reel');
		const nameEl = hero.querySelector<HTMLElement>('[data-shr-name]');
		const metaEl = hero.querySelector<HTMLElement>('[data-shr-meta]');
		const film = hero.querySelector<HTMLElement>('.shr-reel');

		let at = 0;
		let timer = 0;
		let pinned: HTMLElement | null = null;

		const retime = (el: HTMLElement | null) => {
			if (!el) return;
			el.style.animation = 'none';
			void el.offsetWidth;
			el.style.animation = '';
		};

		const light = (art: HTMLElement | undefined | null) => {
			if (!art) return;
			arts.forEach((a) => a.classList.toggle('is-lit', a === art));
			const tint = art.dataset.tint;
			if (tint) hero.style.setProperty('--sa', tint);
			if (nameEl && nameEl.textContent !== art.dataset.name) {
				nameEl.textContent = art.dataset.name || '';
				retime(nameEl);
			}
			if (metaEl && metaEl.textContent !== art.dataset.meta) {
				metaEl.textContent = art.dataset.meta || '';
				retime(metaEl);
			}
		};

		const stop = () => {
			if (timer) window.clearInterval(timer);
			timer = 0;
		};
		const start = () => {
			if (still.matches || !arts.length) return;
			stop();
			timer = window.setInterval(() => {
				if (pinned) return;
				at = (at + 1) % arts.length;
				light(arts[at]);
			}, 3600);
		};

		// hovering a piece pins the room to it; leaving hands it back to
		// whatever the rotation had reached
		arts.forEach((art, i) => {
			const take = () => {
				pinned = art;
				at = i;
				light(art);
			};
			const give = () => {
				if (pinned === art) pinned = null;
			};
			art.addEventListener('pointerenter', take);
			art.addEventListener('focus', take);
			art.addEventListener('pointerleave', give);
			art.addEventListener('blur', give);
		});

		light(arts[0]);
		const isStudio = () =>
			document.documentElement.getAttribute('data-view') === 'studio';
		if (isStudio()) start();
		window.addEventListener('swizel:viewchange', (e) => {
			if ((e as CustomEvent).detail === 'studio') { at = 0; light(arts[0]); start(); }
			else stop();
		});

		// ── the spotlight ───────────────────────────────────────────
		// One pointermove, one rAF, two writes: the beam's centre. The
		// deck tilts a shade with it so the room has a little depth.
		if (!still.matches) {
			let raf = 0;
			let mx = 62;
			let my = 34;

			const paint = () => {
				raf = 0;
				hero.style.setProperty('--mx', `${mx}%`);
				hero.style.setProperty('--my', `${my}%`);
				// the pieces read --px/--py and multiply by their own depth,
				// so the further a frame hangs the further it swims
				if (wall) {
					wall.style.setProperty('--px', `${((mx - 50) / 50 * -5).toFixed(2)}px`);
					wall.style.setProperty('--py', `${((my - 50) / 50 * -4).toFixed(2)}px`);
				}
				if (reelMat) {
					reelMat.style.setProperty('--ry', `${((mx - 50) / 50 * 3).toFixed(2)}deg`);
					reelMat.style.setProperty('--rx', `${((my - 50) / 50 * -2.4).toFixed(2)}deg`);
				}
			};

			hero.addEventListener('pointermove', (e) => {
				if (e.pointerType === 'touch') return;
				const r = hero.getBoundingClientRect();
				mx = ((e.clientX - r.left) / r.width) * 100;
				my = ((e.clientY - r.top) / r.height) * 100;
				if (!raf) raf = requestAnimationFrame(paint);
			});
			hero.addEventListener('pointerleave', () => {
				mx = 62;
				my = 34;
				pinned = null;
				if (!raf) raf = requestAnimationFrame(paint);
			});
		}
	}

	// the tour walks the whole studio world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-studio .shr-rhead',
			title: 'Private view',
			body: 'You imagine it. We design, build, film and launch it — and it ends up on this wall.',
		},
		{
			sel: '#studio-gallery .shr-reel',
			title: 'The studio reel',
			body: 'A year of work in ninety seconds. It runs on its own — press it to take control.',
		},
		{
			sel: '#studio-gallery .shr-side--l',
			title: 'Six pieces, hung',
			body: 'Real client work either side of the film. One is lit at a time, and the whole room takes its colour.',
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
