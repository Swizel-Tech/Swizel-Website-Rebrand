// The fan walks itself.
//
// One blade is up at a time, the pad beside the pivot carries that blade's
// answer, and the bar underneath drains so you can see the next one coming.
// Point at a blade and the walk parks; leave it alone and it resumes.

export function initValueFan() {
	const fans = Array.from(document.querySelectorAll<HTMLElement>('[data-vfan]'));
	if (!fans.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const lite = document.documentElement.classList.contains('perf-lite');

	fans.forEach((fan) => {
		if (fan.dataset.vfanBound === '1') return;
		fan.dataset.vfanBound = '1';

		const blades = Array.from(fan.querySelectorAll<HTMLElement>('[data-vfan-blade]'));
		const slots = Array.from(fan.querySelectorAll<HTMLElement>('[data-vfan-slot]'));
		const dots = Array.from(fan.querySelectorAll<HTMLElement>('[data-vfan-dot]'));
		const readout = fan.querySelector<HTMLElement>('[data-vfan-at]');
		const prev = fan.querySelector<HTMLButtonElement>('[data-vfan-prev]');
		const next = fan.querySelector<HTMLButtonElement>('[data-vfan-next]');
		if (blades.length < 2 || slots.length !== blades.length) return;

		const total = blades.length;
		const every = Math.max(0, Number(fan.dataset.every || '5')) * 1000;
		const hold = lite ? every * 1.6 : every;
		fan.style.setProperty('--vf-hold', `${hold}ms`);

		let at = 0;
		let seen = false;
		let resumeAt = 0;
		let last = performance.now();

		const paint = () => {
			blades.forEach((b, i) => b.setAttribute('aria-pressed', i === at ? 'true' : 'false'));
			slots.forEach((s, i) => {
				s.classList.toggle('is-on', i === at);
				s.setAttribute('aria-hidden', i === at ? 'false' : 'true');
			});
			if (readout) readout.textContent = String(at + 1).padStart(2, '0');
			dots.forEach((d, i) => {
				d.setAttribute('aria-selected', i === at ? 'true' : 'false');
				// restart the drain rather than letting it continue from where
				// the last one stopped
				const f = d.firstElementChild as HTMLElement | null;
				if (f && i !== at) {
					f.style.transition = 'none';
					f.style.width = '0';
					void f.offsetWidth;
					f.style.transition = '';
				}
			});
		};

		const take = (i: number, park = 9000) => {
			at = ((i % total) + total) % total;
			resumeAt = performance.now() + park;
			last = performance.now();
			paint();
		};

		blades.forEach((b, i) => {
			b.addEventListener('click', () => take(i, 12000));
			b.addEventListener('pointerenter', () => take(i, 7000));
			b.addEventListener('focus', () => take(i, 12000));
		});
		dots.forEach((d, i) => d.addEventListener('click', () => take(i, 12000)));
		// the arrows park the walk for longer: somebody steering wants to read
		prev?.addEventListener('click', () => take(at - 1, 16000));
		next?.addEventListener('click', () => take(at + 1, 16000));
		// and the same from the keyboard once anything in the fan has focus
		fan.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') { e.preventDefault(); take(at - 1, 16000); }
			if (e.key === 'ArrowRight') { e.preventDefault(); take(at + 1, 16000); }
		});

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(es) => es.forEach((e) => (seen = e.isIntersecting)),
				{ threshold: 0.2 }
			).observe(fan);
		} else {
			seen = true;
		}

		if (every > 0 && !reduce) {
			window.setInterval(() => {
				if (!seen || document.hidden || performance.now() < resumeAt) {
					last = performance.now();
					return;
				}
				if (performance.now() - last >= hold) {
					at = (at + 1) % total;
					last = performance.now();
					paint();
				}
			}, 180);
		}

		paint();
	});
}
