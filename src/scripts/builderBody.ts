// Builder body interactions (built section by section).
export function initBuilderBody() {
	const body = document.querySelector('.view-body-builder');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let played = false;

	const counts = Array.from(body.querySelectorAll<HTMLElement>('[data-count]'));
	const run = () => {
		if (played) return;
		played = true;
		counts.forEach((el) => {
			const t = Number(el.dataset.count || '0');
			const sfx = el.dataset.suffix || '';
			if (reduce) {
				el.textContent = t + sfx;
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / 1200, 1);
				el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * t) + sfx;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
	};

	const isBuilder = () =>
		document.documentElement.getAttribute('data-view') === 'builder';
	if (isBuilder()) setTimeout(run, 400);
	window.addEventListener('swizel:viewchange', (e) => {
		if ((e as CustomEvent).detail === 'builder') {
			played = false;
			setTimeout(run, 300);
		}
	});
}
