import { openTourChooser, siteLegs, type TourStep } from './tour';

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

	// the tour walks the whole builder world, hero to footer
	const steps: TourStep[] = [
		{
			sel: '.hero-builder .rhead',
			title: 'Our promise',
			body: 'You imagine it. We build, design, scale and launch it.',
		},
		{
			sel: '#builder-ide .ide2--code',
			title: 'A real editor',
			body: 'This is live code, not a screenshot. Edit it, then press run and watch products deploy below.',
		},
		{
			sel: '#view-banner .vw-head',
			title: 'Five worlds, one Swizel',
			body: 'This site reshapes around you. Step into any world, anytime — nothing is locked.',
		},
		{
			sel: '#bb-term',
			title: 'Your kickoff, typed live',
			body: 'swizel init your-product — design system, engineers and pipeline, ready in weeks.',
		},
		{
			sel: '#bb-game',
			title: 'The idea compiler',
			body: 'Go on — hit the build button. We dare you.',
		},
		{
			sel: '#bb-editor',
			title: 'Services as source files',
			body: 'Design, build, market, maintain — click through the tabs like a real IDE.',
		},
		{
			sel: '#bb-git',
			title: 'git log --your-product',
			body: 'Our process as commits: from init to release, every push visible.',
		},
		{
			sel: '.bb-deploys',
			title: 'Live in production',
			body: 'A deployments panel of real products — green dots, real domains, real uptime.',
		},
		{
			sel: '.bb-prs',
			title: 'Code review: approved',
			body: 'Clients sign off like pull requests — +1 product, −0 regrets.',
		},
		{
			sel: '.bb-cta',
			title: 'Ready to merge?',
			body: 'Start your branch — a senior engineer replies within one business day.',
		},
		{
			sel: '.site-footer .ft-socials',
			title: 'Follow the build',
			body: 'Daily updates and behind the scenes — hover any handle for a preview.',
		},
	];
	document
		.querySelectorAll('[data-tour-start="builder"]')
		.forEach((b) => b.addEventListener('click', () => openTourChooser(steps, siteLegs(steps))));
}

/**
 * The hero panel: two files open in one editor window. Tab or click to
 * swap. Switching away from the reel pauses it, because a film playing in
 * a pane nobody is looking at is just noise.
 */
export function initBuilderStack() {
	document.querySelectorAll<HTMLElement>('[data-bstack]').forEach((stack) => {
		if (stack.dataset.bstackOn) return;
		stack.dataset.bstackOn = '1';

		const tabs = Array.from(
			stack.querySelectorAll<HTMLButtonElement>('[data-bstack-tab]')
		);
		const panes = Array.from(
			stack.querySelectorAll<HTMLElement>('[data-bstack-pane]')
		);
		if (!tabs.length || !panes.length) return;

		const show = (name: string) => {
			tabs.forEach((t) => {
				const on = t.dataset.bstackTab === name;
				t.classList.toggle('is-on', on);
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.tabIndex = on ? 0 : -1;
			});
			panes.forEach((p) => {
				const on = p.dataset.bstackPane === name;
				p.hidden = !on;
				p.classList.toggle('is-on', on);
				// a film in a closed pane stops; the shared player owns its own
				// state, so pausing its <video> or telling the iframe is enough
				if (!on) {
					p.querySelectorAll<HTMLVideoElement>('video').forEach((v) => v.pause());
					p.querySelectorAll<HTMLIFrameElement>('iframe').forEach((f) =>
						f.contentWindow?.postMessage(
							'{"event":"command","func":"pauseVideo","args":""}',
							'*'
						)
					);
				}
			});
		};

		tabs.forEach((t) =>
			t.addEventListener('click', () => show(t.dataset.bstackTab || 'run'))
		);

		// arrow keys walk the strip, the way a real tab bar does
		stack.querySelector('[role="tablist"]')?.addEventListener('keydown', (e) => {
			const ev = e as KeyboardEvent;
			if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
			const at = tabs.findIndex((t) => t.classList.contains('is-on'));
			const next = tabs[(at + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
			if (!next) return;
			ev.preventDefault();
			show(next.dataset.bstackTab || 'run');
			next.focus();
		});
	});
}
