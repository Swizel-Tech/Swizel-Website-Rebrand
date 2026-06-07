import { startTour, type TourStep } from './tour';

const esc = (s: string) =>
	s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c));

export function initBuilderView() {
	const ide = document.getElementById('builder-ide');
	if (!ide) return;
	const code = ide.querySelector<HTMLTextAreaElement>('.ide2--code');
	const out = document.getElementById('builder-out');
	const runBtn = ide.querySelector<HTMLButtonElement>('.ide2--run');
	const gutter = ide.querySelector<HTMLElement>('.ide2--gutter');
	if (!code || !out) return;

	const renderGutter = () => {
		if (!gutter) return;
		const n = code.value.split('\n').length;
		gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
	};

	const run = () => {
		const ships: [string, string][] = [];
		const lines: [string, string][] = [];
		const ship = (name: unknown, sector: unknown) =>
			ships.push([String(name), String(sector)]);
		const done = (m: unknown) => lines.push(['done', String(m)]);
		const print = (...a: unknown[]) =>
			lines.push(['line', a.map((x) => String(x)).join(' ')]);
		try {
			// eslint-disable-next-line no-new-func
			const fn = new Function('ship', 'done', 'print', 'console', code.value);
			fn(ship, done, print, { log: print, info: print, error: print });
			let html = '';
			ships.forEach(([n, s], i) => {
				html +=
					'<div class="ide2--row" style="--d:' +
					(i * 0.18).toFixed(2) +
					's"><span class="ide2--rocket">🚀</span><span class="ide2--name">' +
					esc(n) +
					'</span><span class="ide2--pill">' +
					esc(s) +
					'</span><span class="ide2--ok">deployed ✓</span></div>';
			});
			lines.forEach(([t, m]) => {
				if (t === 'done')
					html +=
						'<div class="ide2--done" style="animation-delay:' +
						(ships.length * 0.18 + 0.1).toFixed(2) +
						's">✦ ' +
						esc(m) +
						'</div>';
				else html += '<div class="ide2--row"><span>' + esc(m) + '</span></div>';
			});
			out.innerHTML = html;
		} catch (err) {
			out.innerHTML =
				'<div class="ide2--err">⚠ ' +
				esc(err instanceof Error ? err.message : String(err)) +
				'</div>';
		}
	};

	let typed = false;
	const typeAndRun = () => {
		if (typed) {
			run();
			return;
		}
		typed = true;
		const full = code.value;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			renderGutter();
			run();
			return;
		}
		code.value = '';
		renderGutter();
		let i = 0;
		const step = () => {
			code.value = full.slice(0, i);
			renderGutter();
			i += 2;
			if (i <= full.length) setTimeout(step, 11);
			else {
				code.value = full;
				renderGutter();
				setTimeout(run, 220);
			}
		};
		step();
	};

	const dismissCue = () => {
		document.getElementById('builder-ide-cue')?.classList.add('is-hidden');
		runBtn?.classList.add('is-done');
	};
	code.addEventListener('input', () => {
		renderGutter();
		dismissCue();
	});
	renderGutter();
	runBtn?.addEventListener('click', () => {
		dismissCue();
		run();
	});
	code.addEventListener('keydown', (e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			dismissCue();
			run();
		}
	});

	const isBuilder = () =>
		document.documentElement.getAttribute('data-view') === 'builder';
	if (isBuilder()) setTimeout(typeAndRun, 450);
	window.addEventListener('swizel:viewchange', (e) => {
		if ((e as CustomEvent).detail === 'builder') {
			typed = false;
			setTimeout(typeAndRun, 350);
		}
	});

	const steps: TourStep[] = [
		{
			sel: '.hero-builder .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it. This line is our signature in every view.',
		},
		{
			sel: '#builder-ide .ide2--code',
			title: 'A real editor',
			body: 'This is live code, not a screenshot. Edit it however you like.',
		},
		{
			sel: '#builder-ide .ide2--run',
			title: 'Press run',
			body: 'Run it and watch real Swizel products deploy in the console below.',
		},
		{
			sel: '#builder-out',
			title: 'Proof, across sectors',
			body: 'Every line is a product we shipped, tagged by industry. The best way to prove we can build anything is to show what we already have.',
		},
		{
			sel: '.hero-builder [data-tour="stats"]',
			title: '7+ years',
			body: '65+ products and 25+ specialists, spanning fintech, health, agric, sports and more.',
		},
		{
			sel: '.hero-builder [data-tour="team"]',
			title: 'Real people',
			body: 'Behind every line is a real team. Tap here to meet the humans who build with you.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="builder"]')
		.forEach((b) => b.addEventListener('click', () => startTour(steps)));
}
