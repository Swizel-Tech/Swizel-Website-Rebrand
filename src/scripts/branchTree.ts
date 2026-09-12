// Walks the tree: lights one branch at a time, and hands over the moment
// somebody points at it.

export function initBranchTree() {
	const trees = Array.from(document.querySelectorAll<HTMLElement>('[data-tree]'));
	if (!trees.length) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	trees.forEach((tree) => {
		if (tree.dataset.treeBound === '1') return;
		tree.dataset.treeBound = '1';

		const branches = Array.from(tree.querySelectorAll<HTMLElement>('[data-tree-branch]'));
		if (branches.length < 2) return;
		const wires = Array.from(tree.querySelectorAll<SVGPathElement>('[data-tree-wire]'));
		const panels = Array.from(tree.querySelectorAll<HTMLElement>('[data-tree-panel]'));
		const total = branches.length;
		const every = Math.max(0, Number(tree.dataset.every || '4')) * 1000;

		let at = 0;
		let seen = false;
		let resumeAt = 0;
		let last = performance.now();

		const paint = () => {
			branches.forEach((b, i) => b.setAttribute('aria-pressed', i === at ? 'true' : 'false'));
			wires.forEach((w, i) => w.classList.toggle('is-lit', i === at));
			panels.forEach((p, i) => {
				p.classList.toggle('is-on', i === at);
				p.setAttribute('aria-hidden', i === at ? 'false' : 'true');
			});
		};

		const park = (ms = 8000) => {
			resumeAt = performance.now() + ms;
		};

		branches.forEach((b, i) =>
			b.addEventListener('click', () => {
				park();
				at = i;
				last = performance.now();
				paint();
			})
		);
		branches.forEach((b, i) =>
			b.addEventListener('pointerenter', () => {
				park(6000);
				at = i;
				last = performance.now();
				paint();
			})
		);

		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(
				(entries) => entries.forEach((en) => (seen = en.isIntersecting)),
				{ threshold: 0.25 }
			);
			io.observe(tree);
		} else {
			seen = true;
		}

		if (every > 0 && !reduce) {
			window.setInterval(() => {
				if (!seen || document.hidden || performance.now() < resumeAt) {
					last = performance.now();
					return;
				}
				if (performance.now() - last >= every) {
					at = (at + 1) % total;
					last = performance.now();
					paint();
				}
			}, 150);
		}

		paint();
	});
}
