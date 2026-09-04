// The prospectus turns its own pages.
//
// The leaf is a real sheet in 3D: its front face carries a clone of the
// page you are leaving and its back face a clone of the page you are
// arriving at, so what rotates over the spine is the actual paper rather
// than a blank stand-in. The spread underneath is swapped to the
// destination before the rotation starts, which is why the reveal lines
// up as the leaf lifts and why there is no jump when it lands.
const TURN = 880; // ms, matched to the keyframes below
const DWELL = 7000; // ms a spread is left open before it turns itself

export function initCampusLibrary() {
	// The lifted brief locks the page scroll while it is open. If you leave
	// through the link inside it the sheet never gets to close itself, so
	// the lock would ride along to the next page and the body would sit
	// there frozen until a reload. This runs on every swup view.
	document.documentElement.style.removeProperty('overflow');

	document.querySelectorAll<HTMLElement>('[data-library]').forEach((root) => {
		if (root.dataset.bkBound === '1') return;
		root.dataset.bkBound = '1';

		const book = root.querySelector<HTMLElement>('[data-bk-book]');
		const spreads = Array.from(root.querySelectorAll<HTMLElement>('.bk__spread'));
		const leaf = root.querySelector<HTMLElement>('[data-bk-leaf]');
		const front = root.querySelector<HTMLElement>('[data-bk-front]');
		const back = root.querySelector<HTMLElement>('[data-bk-back]');
		const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-bk-go]'));
		const prev = root.querySelector<HTMLButtonElement>('[data-bk-prev]');
		const next = root.querySelector<HTMLButtonElement>('[data-bk-next]');
		const play = root.querySelector<HTMLButtonElement>('[data-bk-play]');
		const sheet = root.querySelector<HTMLElement>('[data-bk-sheet]');
		const sheetBody = root.querySelector<HTMLElement>('[data-bk-sheet-body]');
		const ring = root.querySelector<HTMLElement>('[data-bk-ring]');

		if (!book || !leaf || !front || !back || spreads.length < 2) return;

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let index = 0;
		let turning = false;
		let paused = reduce;
		let timer = 0;
		let onScreen = false;
		// The first turn happens early and on its own, so nobody has to guess
		// that the book turns at all. After that demonstration it rests for a
		// beat, then settles into its ordinary dwell.
		let greeted = 0; // 0 = not yet shown, 1 = showing, 2 = resting, 3 = normal
		const HELLO = 1500; // how long before the book shows what it does
		const REST = 4200; // the pause afterwards, so the demo reads as deliberate

		root.style.setProperty('--bk-turn', `${TURN}ms`);
		root.style.setProperty('--bk-dwell', `${DWELL}ms`);

		// the ring around the pause button drains over the dwell
		const ringStart = () => {
			if (!ring || reduce) return;
			ring.classList.remove('is-live');
			void ring.offsetWidth;
			ring.classList.add('is-live');
		};
		const ringStop = () => ring?.classList.remove('is-live');

		const show = (i: number) => {
			spreads.forEach((sp, n) => {
				sp.classList.remove('is-half-l', 'is-half-r');
				sp.classList.toggle('is-open', n === i);
			});
			dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
		};

		const schedule = () => {
			window.clearTimeout(timer);
			if (paused || !onScreen || sheet?.hasAttribute('hidden') === false) {
				ringStop();
				return;
			}
			// the greeting flap, then the rest, then the usual rhythm
			if (greeted === 0) {
				greeted = 1;
				ringStop();
				timer = window.setTimeout(() => turn(1), HELLO);
				return;
			}
			if (greeted === 1) {
				greeted = 2;
				ringStop();
				timer = window.setTimeout(() => {
					greeted = 3;
					schedule();
				}, REST);
				return;
			}
			timer = window.setTimeout(() => turn(1), DWELL);
			ringStart();
		};

		const turn = (dir: 1 | -1, to?: number) => {
			if (turning) return;
			const target =
				typeof to === 'number' ? to : (index + dir + spreads.length) % spreads.length;
			if (target === index) return;
			const forward = typeof to === 'number' ? to > index : dir === 1;

			// reduced motion, or a jump of more than one spread: just cut
			if (reduce || Math.abs(target - index) > 1) {
				index = target;
				show(index);
				schedule();
				return;
			}

			const fromPage =
				spreads[index]?.querySelector<HTMLElement>(
					forward ? '.bk__page--r' : '.bk__page--l'
				) ?? null;
			const toPage =
				spreads[target]?.querySelector<HTMLElement>(
					forward ? '.bk__page--l' : '.bk__page--r'
				) ?? null;
			if (!fromPage || !toPage) {
				index = target;
				show(index);
				schedule();
				return;
			}

			turning = true;
			front.replaceChildren(fromPage.cloneNode(true));
			back.replaceChildren(toPage.cloneNode(true));

			// Underneath, a real book shows the side you are not turning
			// plus the side you are turning onto — never the whole
			// destination spread. Swapping both halves at once made the
			// still side jump a page before the sheet had covered it, and
			// that flash across the gutter is the crack you could see.
			const fromSpread = spreads[index];
			const toSpread = spreads[target];
			spreads.forEach((sp) => sp.classList.remove('is-open', 'is-half-l', 'is-half-r'));
			fromSpread?.classList.add(forward ? 'is-half-l' : 'is-half-r');
			toSpread?.classList.add(forward ? 'is-half-r' : 'is-half-l');
			dots.forEach((d, n) => d.classList.toggle('is-on', n === target));
			index = target;

			// the bend, the lift and the light all live in the keyframes, so
			// the turn is a class rather than an inline transform
			ringStop();
			leaf.classList.toggle('is-back', !forward);
			leaf.removeAttribute('hidden');
			leaf.classList.remove('is-turning');
			root.classList.remove('is-turning', 'is-turning-back');
			// force a frame so the reset lands before the rotation
			void leaf.offsetWidth;

			// Hand the browser one settled frame with the sheet laid out but
			// not yet moving. Cloning two full pages and starting the
			// rotation in the same frame costs the first 100ms of the turn,
			// which reads as a stumble out of the gate. The timer is the
			// fallback: a throttled tab never runs the frame callback.
			let started = false;
			const start = () => {
				if (started) return;
				started = true;
				leaf.classList.add('is-turning');
				root.classList.add(forward ? 'is-turning' : 'is-turning-back');
			};
			requestAnimationFrame(() => requestAnimationFrame(start));
			window.setTimeout(start, 90);

			window.setTimeout(() => {
				show(index);
				leaf.setAttribute('hidden', '');
				leaf.classList.remove('is-turning');
				root.classList.remove('is-turning', 'is-turning-back');
				front.replaceChildren();
				back.replaceChildren();
				turning = false;
				schedule();
			}, TURN + 150);
		};

		next?.addEventListener('click', () => {
			turn(1);
			greeted = 3;
			schedule();
		});
		prev?.addEventListener('click', () => {
			greeted = 3;
			turn(-1);
			schedule();
		});
		dots.forEach((d) =>
			d.addEventListener('click', () => {
				greeted = 3;
				turn(1, Number(d.dataset.bkGo));
				schedule();
			})
		);

		const setPaused = (v: boolean) => {
			paused = v;
			if (v) root.setAttribute('data-paused', '');
			else root.removeAttribute('data-paused');
			play?.setAttribute('aria-label', v ? 'Resume turning' : 'Pause turning');
			schedule();
		};
		play?.addEventListener('click', () => setPaused(!paused));
		if (reduce) root.setAttribute('data-paused', '');

		// a book does not turn its own pages while you are reading it
		book.addEventListener('pointerenter', () => {
			greeted = 3;
			window.clearTimeout(timer);
			ringStop();
		});
		book.addEventListener('pointerleave', schedule);

		// ── the lifted brief ───────────────────────────────────────────
		const closeSheet = () => {
			if (!sheet) return;
			sheet.setAttribute('hidden', '');
			sheetBody?.replaceChildren();
			document.documentElement.style.removeProperty('overflow');
			schedule();
		};
		root.querySelectorAll<HTMLElement>('[data-bk-close]').forEach((b) =>
			b.addEventListener('click', closeSheet)
		);
		// "Apply with this discipline" leaves the page — drop the scroll lock
		// on the way out, or the next page arrives unable to scroll
		sheet?.addEventListener('click', (e) => {
			if ((e.target as HTMLElement | null)?.closest('a[href]')) closeSheet();
		});
		root.querySelectorAll<HTMLElement>('[data-course]').forEach((card) => {
			card.addEventListener('click', () => {
				const code = card.dataset.course;
				const tpl = root.querySelector<HTMLTemplateElement>(
					`template[data-brief="${code}"]`
				);
				if (!tpl || !sheet || !sheetBody) return;
				window.clearTimeout(timer);
				sheetBody.replaceChildren(tpl.content.cloneNode(true));
				sheet.removeAttribute('hidden');
				document.documentElement.style.overflow = 'hidden';
				sheet.querySelector<HTMLElement>('.bk__sheet-x')?.focus();
			});
		});
		document.addEventListener('keydown', (e) => {
			if (e.key !== 'Escape') return;
			if (sheet && !sheet.hasAttribute('hidden')) closeSheet();
		});

		// it only turns while somebody can see it
		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => {
					entries.forEach((en) => {
						onScreen = en.isIntersecting;
						if (onScreen) schedule();
						else window.clearTimeout(timer);
					});
				},
				{ threshold: 0.3 }
			);
			io.observe(book);
		} else {
			onScreen = true;
			schedule();
		}
	});
}
