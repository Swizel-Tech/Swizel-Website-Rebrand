import { views, DEFAULT_VIEW } from '../consts';
import { applyView } from './viewExperience';

// Powers the "choose your world" rail under the hero: keeps the headline
// in sync with the active view, marks the current poster (in both marquee
// copies), and switches worlds on tap.
export function initViewBanner() {
	const banner = document.getElementById('view-banner');
	if (!banner) return;

	const name = banner.querySelector<HTMLElement>('#vb-name');
	const aud = banner.querySelector<HTMLElement>('#vb-aud');
	const cards = Array.from(
		banner.querySelectorAll<HTMLButtonElement>('[data-switch-view]')
	);

	const sync = () => {
		const id =
			document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
		const v = views.find((x) => x.id === id) || views[0];
		if (name) name.textContent = v.name;
		if (aud) aud.textContent = v.audience;
		cards.forEach((c) =>
			c.classList.toggle('is-current', c.dataset.switchView === id)
		);
	};

	cards.forEach((c) =>
		c.addEventListener('click', () => {
			let id = c.dataset.switchView;
			if (!id || c.classList.contains('is-current')) return;
			// the "Surprise me" poster: roll a random world (never the current one)
			if (id === 'surprise') {
				const current =
					document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
				const pool = views.map((v) => v.id).filter((v) => v !== current);
				id = pool[Math.floor(Math.random() * pool.length)] ?? DEFAULT_VIEW;
			}
			applyView(id); // applyView now handles the scroll-to-top
		})
	);

	// ── the rail: arrows, drag, swipe, and a gentle auto-glide ──────────
	const rail = banner.querySelector<HTMLElement>('#vw-rail');
	const prev = banner.querySelector<HTMLButtonElement>('[data-vw-prev]');
	const next = banner.querySelector<HTMLButtonElement>('[data-vw-next]');
	const progress = banner.querySelector<HTMLElement>('#vw-progress-bar');

	if (rail) {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const lite = () => document.documentElement.classList.contains('perf-lite');

		const step = () => {
			const card = rail.querySelector<HTMLElement>('.vw-card');
			if (!card) return rail.clientWidth * 0.8;
			const gap = parseFloat(getComputedStyle(card).marginRight || '0');
			return card.offsetWidth + gap;
		};
		const maxScroll = () => rail.scrollWidth - rail.clientWidth;

		const paint = () => {
			const max = maxScroll();
			const pct = max > 0 ? rail.scrollLeft / max : 0;
			if (progress) {
				const w = progress.parentElement?.clientWidth || 0;
				progress.style.transform = `translateX(${pct * (w - w * 0.22)}px)`;
			}
			if (prev) prev.disabled = rail.scrollLeft < 8;
			if (next) next.disabled = rail.scrollLeft > max - 8;
		};

		const go = (dir: 1 | -1) => {
			const max = maxScroll();
			let target = rail.scrollLeft + dir * step();
			// wrap around rather than dead-ending at either edge
			if (dir === 1 && rail.scrollLeft > max - 8) target = 0;
			if (dir === -1 && rail.scrollLeft < 8) target = max;
			rail.scrollTo({ left: target, behavior: 'smooth' });
		};

		prev?.addEventListener('click', () => {
			hold();
			go(-1);
		});
		next?.addEventListener('click', () => {
			hold();
			go(1);
		});

		// drag with a mouse, exactly as you would flick it on a phone
		let down = false;
		let startX = 0;
		let startLeft = 0;
		let moved = 0;
		rail.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'touch') return; // let the OS do native swipe
			down = true;
			moved = 0;
			startX = e.clientX;
			startLeft = rail.scrollLeft;
			rail.classList.add('is-dragging');
			hold();
		});
		rail.addEventListener('pointermove', (e) => {
			if (!down) return;
			const dx = e.clientX - startX;
			moved = Math.abs(dx);
			rail.scrollLeft = startLeft - dx;
		});
		const endDrag = () => {
			if (!down) return;
			down = false;
			rail.classList.remove('is-dragging');
		};
		rail.addEventListener('pointerup', endDrag);
		rail.addEventListener('pointercancel', endDrag);
		rail.addEventListener('pointerleave', endDrag);
		// a drag should never be mistaken for a click on a poster
		rail.addEventListener(
			'click',
			(e) => {
				if (moved > 6) {
					e.preventDefault();
					e.stopPropagation();
					moved = 0;
				}
			},
			true
		);

		rail.addEventListener('scroll', paint, { passive: true });
		window.addEventListener('resize', paint);

		// auto-glide, and the pause that follows any interaction
		let timer = 0;
		let idle = 0;
        const start = () => {
			if (timer || reduce || lite()) return;
			timer = window.setInterval(() => go(1), 4200);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		function hold() {
			stop();
			window.clearTimeout(idle);
			idle = window.setTimeout(start, 7000);
		}
		rail.addEventListener('pointerenter', stop);
		rail.addEventListener('pointerleave', () => hold());
		rail.addEventListener('focusin', stop);
		rail.addEventListener('wheel', () => hold(), { passive: true });
		rail.addEventListener('touchstart', () => hold(), { passive: true });

		paint();
		start();
	}

	window.addEventListener('swizel:viewchange', sync);
	sync();
}
