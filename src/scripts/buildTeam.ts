// The crew strip: lifts one print at a time and names it underneath.
//
// The prints overlap on purpose, so the name can never live on the print
// itself without the next one cutting it in half. It lives under the fan
// instead, and this walks it: one print up every few seconds, and whichever
// print you point at takes over for a while before the walk resumes.

export function initBuildTeam() {
	const rails = Array.from(document.querySelectorAll<HTMLElement>('[data-bteam]'));
	if (!rails.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const lite = document.documentElement.classList.contains('perf-lite');

	rails.forEach((rail) => {
		if (rail.dataset.bteamBound === '1') return;
		rail.dataset.bteamBound = '1';

		const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-bteam-card]'));
		const root = rail.parentElement;
		const lines = root
			? Array.from(root.querySelectorAll<HTMLElement>('[data-bteam-now-i]'))
			: [];
		if (cards.length < 2 || lines.length !== cards.length) return;

		let at = 0;
		let seen = false;
		let resumeAt = 0;
		let last = performance.now();

		const paint = () => {
			cards.forEach((c, i) => c.classList.toggle('is-up', i === at));
			lines.forEach((l, i) => l.classList.toggle('is-on', i === at));
		};

		const take = (i: number, park = 9000) => {
			at = i;
			resumeAt = performance.now() + park;
			last = performance.now();
			paint();
		};

		cards.forEach((c, i) => {
			c.addEventListener('pointerenter', () => take(i));
			c.addEventListener('focus', () => take(i, 14000));
			c.addEventListener('click', () => take(i, 14000));
		});

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(
				(es) => es.forEach((e) => (seen = e.isIntersecting)),
				{ threshold: 0.2 }
			).observe(rail);
		} else {
			seen = true;
		}

		if (!reduce) {
			const every = lite ? 6000 : 3400;
			window.setInterval(() => {
				if (!seen || document.hidden || performance.now() < resumeAt) {
					last = performance.now();
					return;
				}
				if (performance.now() - last >= every) {
					at = (at + 1) % cards.length;
					last = performance.now();
					paint();
				}
			}, 200);
		}

		paint();
	});
}
