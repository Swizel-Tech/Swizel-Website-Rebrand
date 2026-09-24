import { openTourChooser, siteLegs, type TourStep } from './tour';

export function initStudioView() {
	const hero = document.querySelector<HTMLElement>('[data-shr]');

	if (hero) {
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');

		// ── the exhibit ─────────────────────────────────────────────
		// The reel never moves. The collection travels past it on a ring
		// of six slots: in from the right (+2, +1), behind the film, out
		// to the front-left (-1, -2), then off-stage (±3) and round. Each
		// card is handed its slot number and the sign of it; every bit of
		// the geometry lives in the stylesheet's slot table.
		const RING = [1, 2, 3, -3, -2, -1];
		const FEATURED = 5; // the ring position whose piece the label names

		const deck = hero.querySelector<HTMLElement>('[data-shr-deck]');
		const show = hero.querySelector<HTMLElement>('.shr-show');
		const cards = Array.from(hero.querySelectorAll<HTMLElement>('[data-shr-card]'));
		const ticks = Array.from(hero.querySelectorAll<HTMLElement>('[data-shr-go]'));
		const nameEl = hero.querySelector<HTMLElement>('[data-shr-name]');
		const metaEl = hero.querySelector<HTMLElement>('[data-shr-meta]');
		const visitEl = hero.querySelector<HTMLAnchorElement>('[data-shr-visit]');
		const film = hero.querySelector<HTMLElement>('.shr-reel');

		const n = cards.length;
		let at = 0;
		let timer = 0;

		const retime = (el: HTMLElement | null) => {
			if (!el) return;
			el.style.animation = 'none';
			void el.offsetWidth;
			el.style.animation = '';
		};

		const place = () => {
			let live: HTMLElement | undefined;

			cards.forEach((card, i) => {
				const k = (((i - at) % n) + n) % n;
				const slot = RING[k] ?? 3;
				card.dataset.slot = String(slot);
				card.style.setProperty('--s', String(Math.sign(slot)));
				const isLive = k === FEATURED;
				card.classList.toggle('is-live', isLive);
				if (isLive) live = card;
			});

			ticks.forEach((t, i) => t.classList.toggle('is-on', i === at));
			if (!live) return;

			// the room takes the colour of the piece at the front — the
			// palette comes from the work itself
			const tint = live.dataset.tint;
			if (tint) hero.style.setProperty('--sa', tint);

			if (nameEl) { nameEl.textContent = live.dataset.name || ''; retime(nameEl); }
			if (metaEl) { metaEl.textContent = live.dataset.meta || ''; retime(metaEl); }
			if (visitEl) {
				const href = live.dataset.href;
				visitEl.href = href || '/portfolio';
				if (live.dataset.external) {
					visitEl.target = '_blank';
					visitEl.rel = 'noopener noreferrer';
				} else {
					visitEl.removeAttribute('target');
					visitEl.removeAttribute('rel');
				}
			}
			// restart the countdown on the live tick
			retime(hero.querySelector<HTMLElement>('.shr-tick.is-on i'));
		};

		const go = (i: number) => {
			at = ((i % n) + n) % n;
			place();
		};
		const turn = (d: number) => go(at + d);

		// it turns on its own — unless the film is running, or you are
		// touching it
		const playing = () => !!film?.querySelector('[data-flm].is-started');

		const stop = () => {
			if (timer) window.clearInterval(timer);
			timer = 0;
			show?.classList.add('is-held');
		};
		const start = () => {
			if (still.matches) return;
			if (timer) window.clearInterval(timer);
			show?.classList.remove('is-held');
			timer = window.setInterval(() => {
				if (playing()) return;
				turn(1);
			}, 4600);
		};

		hero.querySelector('[data-shr-next]')?.addEventListener('click', () => { turn(1); start(); });
		hero.querySelector('[data-shr-prev]')?.addEventListener('click', () => { turn(-1); start(); });
		ticks.forEach((t, i) => t.addEventListener('click', () => { go(i); start(); }));

		// clicking a piece brings it to the front; clicking the one already
		// at the front opens it
		cards.forEach((card, i) =>
			card.addEventListener('click', () => {
				if (card.classList.contains('is-live')) {
					const href = card.dataset.href;
					if (href) window.open(href, card.dataset.external ? '_blank' : '_self');
					return;
				}
				go(i - FEATURED);
				start();
			})
		);

		deck?.addEventListener('pointerenter', stop);
		deck?.addEventListener('pointerleave', start);

		// drag, or swipe, to spin it
		if (deck) {
			let downX = 0;
			let down = false;
			deck.addEventListener('pointerdown', (e) => {
				down = true;
				downX = e.clientX;
			});
			deck.addEventListener('pointerup', (e) => {
				if (!down) return;
				down = false;
				const dx = e.clientX - downX;
				if (Math.abs(dx) > 42) { turn(dx < 0 ? 1 : -1); start(); }
			});
			deck.addEventListener('pointercancel', () => { down = false; });
		}

		place();
		const isStudio = () =>
			document.documentElement.getAttribute('data-view') === 'studio';
		if (isStudio()) start();
		window.addEventListener('swizel:viewchange', (e) => {
			if ((e as CustomEvent).detail === 'studio') { go(0); start(); }
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
				if (deck) deck.style.perspectiveOrigin = `${40 + mx * 0.2}% ${40 + my * 0.12}%`;
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
			sel: '#studio-gallery .shr-deck',
			title: 'The collection, turning',
			body: 'The studio reel and six real pieces on a carousel. Drag it, or click anything standing behind.',
		},
		{
			sel: '#studio-gallery .shr-caption',
			title: 'The label',
			body: 'Whatever is centre stage is named here — and the whole room repaints itself in that work\'s colour.',
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
