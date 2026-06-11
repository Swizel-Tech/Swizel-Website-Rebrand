export function initFounderBody() {
	const body = document.querySelector('.view-body-founder');
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

	const miles = Array.from(body.querySelectorAll<HTMLElement>('.fb-mile'));
	if (miles.length) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						const i = miles.indexOf(e.target as HTMLElement);
						(e.target as HTMLElement).style.animationDelay =
							(reduce ? 0 : i * 0.12) + 's';
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.4 }
		);
		miles.forEach((m) => io.observe(m));
	}

	const isFounder = () =>
		document.documentElement.getAttribute('data-view') === 'founder';
	if (isFounder()) setTimeout(run, 400);
	window.addEventListener('swizel:viewchange', (e) => {
		if ((e as CustomEvent).detail === 'founder') {
			played = false;
			setTimeout(run, 300);
		}
	});
}
