// The dealer behind CardShuffle.astro.
//
// Keeps one card face up and the rest fanned behind it, deals on click,
// arrow key, swipe or drag, and turns itself over every few seconds until
// somebody touches it.

export function initCardShuffle() {
	const decks = Array.from(document.querySelectorAll<HTMLElement>('[data-shuffle]'));
	if (!decks.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	decks.forEach((deck) => {
		if (deck.dataset.shufBound === '1') return;
		deck.dataset.shufBound = '1';

		const cards = Array.from(deck.querySelectorAll<HTMLElement>('[data-shuf-card]'));
		if (cards.length < 2) return;
		const pips = Array.from(deck.querySelectorAll<HTMLElement>('[data-shuf-pip]'));
		const now = deck.querySelector<HTMLElement>('[data-shuf-now]');
		const stage = deck.querySelector<HTMLElement>('[data-shuf-stage]');
		const total = cards.length;
		const every = Math.max(0, Number(deck.dataset.every || '6')) * 1000;

		let at = 0;
		let back = false; // which way the leaving card flies
		let timer = 0;
		let resumeAt = 0;

		const paint = () => {
			cards.forEach((c, i) => {
				// distance forward from the face-up card, wrapping round
				const d = (i - at + total) % total;
				if (d === 0) c.dataset.o = '0';
				else if (d >= total - 1 && total > 2) c.dataset.o = back ? 'back' : 'gone';
				else c.dataset.o = String(Math.min(d, 4));
				c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
				// the strip variant reads in DOM order, not deal order
				c.classList.toggle('is-on', i === at);
			});
			pips.forEach((p, i) => p.setAttribute('aria-selected', i === at ? 'true' : 'false'));
			if (now) now.textContent = String(at + 1).padStart(2, '0');
		};

		const park = (ms = 9000) => {
			resumeAt = performance.now() + ms;
		};

		const go = (dir: 1 | -1) => {
			lastDeal = performance.now();
			back = dir < 0;
			at = (at + dir + total) % total;
			paint();
		};

		const jump = (n: number) => {
			lastDeal = performance.now();
			if (n === at) return;
			back = n < at;
			at = n;
			paint();
		};

		deck.querySelector<HTMLButtonElement>('[data-shuf-prev]')?.addEventListener('click', () => {
			park();
			go(-1);
		});
		deck.querySelector<HTMLButtonElement>('[data-shuf-next]')?.addEventListener('click', () => {
			park();
			go(1);
		});
		pips.forEach((p, i) =>
			p.addEventListener('click', () => {
				park();
				jump(i);
			})
		);

		// the face-up card is itself the "next" button — tapping the stack is
		// the gesture everyone tries first
		cards.forEach((c) =>
			c.addEventListener('click', (e) => {
				if ((e.target as HTMLElement).closest('a')) return;
				park();
				go(1);
			})
		);

		// flick it, on glass or with a mouse
		let downX = 0;
		let dragging = false;
		stage?.addEventListener(
			'pointerdown',
			(e) => {
				dragging = true;
				downX = e.clientX;
				stage.classList.add('is-dragging');
			},
			{ passive: true }
		);
		const release = (e: PointerEvent) => {
			if (!dragging) return;
			dragging = false;
			stage?.classList.remove('is-dragging');
			const dx = e.clientX - downX;
			if (Math.abs(dx) > 46) {
				park();
				go(dx < 0 ? 1 : -1);
			}
		};
		stage?.addEventListener('pointerup', release);
		stage?.addEventListener('pointercancel', () => {
			dragging = false;
			stage.classList.remove('is-dragging');
		});

		deck.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowRight') {
				e.preventDefault();
				park();
				go(1);
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				park();
				go(-1);
			}
		});

		deck.addEventListener('pointerenter', () => park(14000));
		deck.addEventListener('pointerleave', () => park(1200));

		// the ring round the next button counts down to the next deal, so
		// the reader can see the thing is alive and about to move
		const ring = deck.querySelector<SVGCircleElement>('[data-shuf-ring]');
		const LEN = 113;
		let lastDeal = performance.now();
		const paintRing = () => {
			if (!ring) return;
			if (every <= 0 || reduce) {
				ring.style.strokeDashoffset = String(LEN);
				return;
			}
			const waiting = performance.now() < resumeAt;
			deck.classList.toggle('is-held', waiting);
			const p = waiting ? 0 : Math.min((performance.now() - lastDeal) / every, 1);
			ring.style.strokeDashoffset = String(LEN * (1 - p));
		};

		// it deals itself, but only while somebody is looking at it
		if (every > 0 && !reduce) {
			let seen = false;
			if ('IntersectionObserver' in window) {
				const io = new IntersectionObserver(
					(entries) => entries.forEach((en) => (seen = en.isIntersecting)),
					{ threshold: 0.35 }
				);
				io.observe(deck);
			} else {
				seen = true;
			}
			timer = window.setInterval(() => {
				if (!seen || document.hidden) {
					lastDeal = performance.now();
					return;
				}
				if (performance.now() < resumeAt) {
					lastDeal = performance.now();
					paintRing();
					return;
				}
				if (performance.now() - lastDeal >= every) {
					lastDeal = performance.now();
					go(1);
				}
				paintRing();
			}, 120);
			window.addEventListener('swizel:beforeleave', () => window.clearInterval(timer));
		}

		paint();
	});
}
