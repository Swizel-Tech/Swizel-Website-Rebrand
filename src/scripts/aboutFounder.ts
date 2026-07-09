// About · Founder view — motion engine. 3D pointer tilt on cards, the
// journey line that draws itself, floating chips parallax, and magnetic CTA.
// Idempotent: safe to call on every swup navigation.
export function initAboutFounder() {
	// Binds every founder-world page body (About, Services hub, details, …).
	document
		.querySelectorAll<HTMLElement>(
			'.fabout, .fsvc, .fsd, .fpf, .fcs, .fbl, .bbody, .sabout, .ssvc, .ssd, .spf, .scs, .sbl, .cabout, .csvc, .csd'
		)
		.forEach((root) => bindFounderMotion(root));
}

function bindFounderMotion(root: HTMLElement) {
	if (root.dataset.faBound) return;
	root.dataset.faBound = '1';
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── 3D pointer tilt (photo, value cards, team cards, quotes) ──
	if (!reduce) {
		root.querySelectorAll<HTMLElement>('[data-fa-tilt]').forEach((card) => {
			const strength = Number(card.dataset.faTilt || '10');
			let raf = 0;
			card.addEventListener('pointermove', (e) => {
				if (raf) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					const r = card.getBoundingClientRect();
					const px = (e.clientX - r.left) / r.width - 0.5;
					const py = (e.clientY - r.top) / r.height - 0.5;
					card.style.transform = `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateY(-4px)`;
					card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
					card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
				});
			});
			card.addEventListener('pointerleave', () => {
				card.style.transform = '';
			});
		});
	}

	// ── the journey line draws itself + nodes pop as it passes ──
	const journey = root.querySelector<HTMLElement>('.fa-journey');
	if (journey) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						journey.classList.add('is-drawing');
						io.unobserve(journey);
					}
				});
			},
			{ threshold: 0.25 }
		);
		io.observe(journey);
	}

	// ── hero floating chips drift gently with the pointer ──
	const hero = root.querySelector<HTMLElement>('.fa-open');
	if (hero && !reduce) {
		let raf = 0;
		hero.addEventListener('pointermove', (e) => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const r = hero.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width - 0.5;
				const py = (e.clientY - r.top) / r.height - 0.5;
				hero.querySelectorAll<HTMLElement>('.fa-chip').forEach((chip, i) => {
					const depth = (i % 3) + 1;
					chip.style.setProperty(
						'--drift',
						`translate(${px * depth * 9}px, ${py * depth * 9}px)`
					);
				});
			});
		});
	}

	// ── team profile modal (same data contract in every world) ──
	const modal = root.querySelector<HTMLElement>(
		'#fa-member-modal, .fa-member-modal'
	);
	if (modal) {
		const photo = modal.querySelector<HTMLImageElement>('#fa-modal-photo')!;
		const name = modal.querySelector<HTMLElement>('#fa-modal-name')!;
		const role = modal.querySelector<HTMLElement>('#fa-modal-role')!;
		const bio = modal.querySelector<HTMLElement>('#fa-modal-bio')!;
		const linkedin = modal.querySelector<HTMLAnchorElement>('#fa-modal-linkedin')!;
		const expWrap = modal.querySelector<HTMLElement>('#fa-modal-exp-wrap')!;
		const expList = modal.querySelector<HTMLElement>('#fa-modal-exp')!;

		const close = () => {
			modal.classList.remove('is-open');
			window.setTimeout(() => {
				modal.hidden = true;
			}, 250);
			document.documentElement.style.overflow = '';
			// drop the root back under the sticky header
			root.style.zIndex = '';
			root.style.position = '';
		};

		root.querySelectorAll<HTMLElement>('[data-fa-member]').forEach((btn) => {
			btn.addEventListener('click', () => {
				const n = btn.dataset.name || '';
				photo.src = `/teammates/${n}.jpg`;
				photo.alt = n;
				name.textContent = n;
				role.textContent = btn.dataset.role || '';
				bio.textContent = btn.dataset.bio || '';
				const li = btn.dataset.linkedin || '';
				linkedin.hidden = !li;
				if (li) linkedin.href = li;
				let exp: { company: string; jobDesc: string }[] = [];
				try {
					exp = JSON.parse(btn.dataset.exp || '[]');
				} catch {}
				expWrap.hidden = !exp.length;
				expList.innerHTML = exp
					.map(
						(x) =>
							`<li><strong>${x.company}</strong><em>${x.jobDesc}</em></li>`
					)
					.join('');
				modal.hidden = false;
				requestAnimationFrame(() => modal.classList.add('is-open'));
				document.documentElement.style.overflow = 'hidden';
				// the root is an isolated stacking context that normally sits
				// BELOW the sticky header (z-50) — lift it while the modal is
				// open so the close button is never buried under the nav
				root.style.position = 'relative';
				root.style.zIndex = '130';
			});
		});
		modal
			.querySelectorAll<HTMLElement>('[data-fa-modal-close]')
			.forEach((el) => el.addEventListener('click', close));
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !modal.hidden) close();
		});
	}

	// ── the portfolio fan auto-shuffles (top card dives under the deck) ──
	const fan = root.querySelector<HTMLElement>('.fp-fan');
	if (fan && !reduce) {
		const shuffle = () => {
			if (fan.matches(':hover')) return; // hover = fanned out, don't fight it
			const cards = Array.from(
				fan.querySelectorAll<HTMLElement>('.fp-fan-card')
			);
			if (cards.length < 2) return;
			const top = cards[cards.length - 1];
			top.classList.add('fp-fly');
			window.setTimeout(() => {
				// dive under: repaint at the bottom of the stack, re-slot everyone
				fan.insertBefore(top, cards[0]);
				top.classList.remove('fp-fly');
				Array.from(
					fan.querySelectorAll<HTMLElement>('.fp-fan-card')
				).forEach((c, i) => c.style.setProperty('--i', String(i)));
			}, 600);
		};
		const iv = window.setInterval(shuffle, 3000);
		// stop looping if the fan leaves the DOM (swup navigation)
		const mo = new MutationObserver(() => {
			if (!document.contains(fan)) {
				window.clearInterval(iv);
				mo.disconnect();
			}
		});
		mo.observe(document.body, { childList: true, subtree: true });
	}

	// ── magnetic CTA buttons ──
	if (!reduce) {
		root.querySelectorAll<HTMLElement>('.fa-cta, .fs-cta').forEach((cta) => {
			cta.addEventListener('pointermove', (e) => {
				const r = cta.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width - 0.5;
				const py = (e.clientY - r.top) / r.height - 0.5;
				cta.style.transform = `translate(${px * 8}px, ${py * 6 - 2}px)`;
			});
			cta.addEventListener('pointerleave', () => {
				cta.style.transform = '';
			});
		});
	}
}
