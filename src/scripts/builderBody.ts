// Builder world: terminal typing, service file tabs, scroll reveals
// and mono counters. Everything triggers as it scrolls into view.
export function initBuilderBody() {
	const body = document.querySelector('.bbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── scroll reveals ──
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.bb-rev'));
	if (reveals.length) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.15 }
		);
		reveals.forEach((r) => io.observe(r));
	}

	// ── counters ──
	const counts = Array.from(body.querySelectorAll<HTMLElement>('[data-count]'));
	if (counts.length) {
		const run = (el: HTMLElement) => {
			const t = Number(el.dataset.count || '0');
			const sfx = el.dataset.suffix || '';
			// respect data-decimals so 99.9% doesn't round up to 100%
			const dec = Number(el.dataset.decimals || '0');
			if (reduce) {
				el.textContent = t.toFixed(dec) + sfx;
				return;
			}
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / 1200, 1);
				el.textContent =
					((1 - Math.pow(1 - p, 3)) * t).toFixed(dec) + sfx;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						run(e.target as HTMLElement);
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.6 }
		);
		counts.forEach((c) => io.observe(c));
	}

	// ── terminal: type the $ commands, print the output ──
	const term = body.querySelector<HTMLElement>('#bb-term');
	if (term) {
		const lines = Array.from(term.querySelectorAll<HTMLElement>('.bb-tline'));
		let played = false;

		const play = async () => {
			if (played) return;
			played = true;
			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			for (const line of lines) {
				const txtEl = line.querySelector<HTMLElement>('.bb-ttext');
				const text = line.dataset.text || '';
				line.classList.add('is-on');
				if (!txtEl) continue; // trailing cursor line
				if (reduce) {
					txtEl.textContent = text;
					continue;
				}
				if (line.dataset.cmd) {
					// type it like a human (a quick one)
					for (let i = 0; i <= text.length; i++) {
						txtEl.textContent = text.slice(0, i);
						await sleep(34);
					}
					await sleep(260);
				} else {
					txtEl.textContent = text;
					await sleep(190);
				}
			}
		};

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						play();
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.4 }
		);
		io.observe(term);
	}

	// ── the idea compiler game ──
	const game = body.querySelector<HTMLElement>('#bb-game');
	if (game) {
		const btn = game.querySelector<HTMLButtonElement>('#bb-game-btn');
		const fill = game.querySelector<HTMLElement>('#bb-game-fill');
		const msg = game.querySelector<HTMLElement>('#bb-game-msg');
		const status = game.querySelector<HTMLElement>('#bb-game-status');
		const ship = game.querySelector<HTMLElement>('#bb-game-ship');
		const burst = game.querySelector<HTMLElement>('#bb-game-burst');
		const steps = [
			'installing genius…',
			'brewing coffee ☕',
			'compiling dreams…',
			'reticulating splines…',
			'polishing pixels ✨',
		];
		const sparks = ['🚀', '✨', '⚡', '🎉', '💚', '🔥'];

		const explode = () => {
			if (!burst || reduce) return;
			burst.innerHTML = '';
			for (let i = 0; i < 16; i++) {
				const s = document.createElement('span');
				s.className = 'bb-spark';
				s.textContent = sparks[i % sparks.length];
				s.style.setProperty('--x', 15 + Math.random() * 70 + '%');
				s.style.setProperty('--y', 55 + Math.random() * 25 + '%');
				s.style.setProperty('--dx', (Math.random() - 0.5) * 220 + 'px');
				s.style.setProperty('--dy', -(60 + Math.random() * 140) + 'px');
				s.style.setProperty('--rot', (Math.random() - 0.5) * 240 + 'deg');
				s.style.animationDelay = Math.random() * 0.15 + 's';
				burst.appendChild(s);
			}
			window.setTimeout(() => burst && (burst.innerHTML = ''), 1400);
		};

		btn?.addEventListener('click', () => {
			if (!btn || !fill || !msg || !status) return;
			btn.disabled = true;
			ship?.setAttribute('hidden', '');
			status.textContent = 'building…';
			status.classList.remove('is-pass');
			fill.style.width = '0%';
			let i = 0;
			const tick = () => {
				if (i < steps.length) {
					msg.textContent = steps[i];
					fill.style.width = ((i + 1) / steps.length) * 100 + '%';
					i++;
					window.setTimeout(tick, reduce ? 60 : 650);
				} else {
					status.textContent = '✓ build passing';
					status.classList.add('is-pass');
					msg.textContent = 'your idea compiles. it deserves production.';
					explode();
					ship?.removeAttribute('hidden');
					btn.disabled = false;
					btn.textContent = '$ npm run build:again';
				}
			};
			tick();
		});
	}

	// ── CI pipeline: install → build → test → deploy, on a loop ──
	const ci = body.querySelector<HTMLElement>('#bb-ci');
	if (ci) {
		const steps = Array.from(ci.querySelectorAll<HTMLElement>('.bb-ci-step'));
		const pass = ci.querySelector<HTMLElement>('#bb-ci-pass');
		let timer = 0;

		const cycle = () => {
			let i = 0;
			steps.forEach((s) => s.classList.remove('is-running', 'is-done'));
			pass?.classList.remove('is-on');
			const next = () => {
				if (i > 0) {
					steps[i - 1].classList.remove('is-running');
					steps[i - 1].classList.add('is-done');
				}
				if (i >= steps.length) {
					pass?.classList.add('is-on');
					timer = window.setTimeout(cycle, 2600);
					return;
				}
				steps[i].classList.add('is-running');
				i++;
				timer = window.setTimeout(next, 900);
			};
			next();
		};

		if (reduce) {
			// static: all green, badge on
			steps.forEach((s) => s.classList.add('is-done'));
			pass?.classList.add('is-on');
		} else {
			const io = new IntersectionObserver(
				(entries) =>
					entries.forEach((e) => {
						if (e.isIntersecting) {
							if (!timer) cycle();
						} else {
							window.clearTimeout(timer);
							timer = 0;
						}
					}),
				{ threshold: 0.3 }
			);
			io.observe(ci);
		}
	}

	// ── service files: tab switching + auto-cycle until touched ──
	const editor = body.querySelector<HTMLElement>('#bb-editor');
	if (editor) {
		const tabs = Array.from(editor.querySelectorAll<HTMLButtonElement>('.bb-tab'));
		const panes = Array.from(editor.querySelectorAll<HTMLElement>('.bb-file'));
		const select = (tab: HTMLButtonElement) => {
			const id = tab.dataset.tab;
			tabs.forEach((t) => {
				const on = t === tab;
				t.classList.toggle('is-on', on);
				t.setAttribute('aria-selected', String(on));
			});
			panes.forEach((p) => p.classList.toggle('is-on', p.dataset.file === id));
		};
		let auto = 0;
		tabs.forEach((tab) =>
			tab.addEventListener('click', () => {
				window.clearInterval(auto); // the visitor took the wheel
				auto = 0;
				select(tab);
			})
		);
		// flip through the files on a loop until the visitor clicks
		if (!reduce) {
			const io = new IntersectionObserver(
				(entries) =>
					entries.forEach((e) => {
						if (e.isIntersecting && !auto) {
							auto = window.setInterval(() => {
								const i = tabs.findIndex((t) => t.classList.contains('is-on'));
								select(tabs[(i + 1) % tabs.length]);
							}, 3200);
						} else if (!e.isIntersecting && auto) {
							window.clearInterval(auto);
							auto = 0;
						}
					}),
				{ threshold: 0.35 }
			);
			io.observe(editor);
		}
	}

	// ── the deploy console: ships real projects on a loop ──
	const con = body.querySelector<HTMLElement>('#pb-console');
	if (con) {
		const data = Array.from(
			con.querySelectorAll<HTMLElement>('[data-pb-project]')
		).map((el) => ({
			slug: el.dataset.slug || '',
			name: el.dataset.name || '',
			host: el.dataset.host || '',
			sector: el.dataset.sector || '',
		}));
		const cmd = con.querySelector<HTMLElement>('#pb-cmd');
		const fill = con.querySelector<HTMLElement>('#pb-fill');
		const log = con.querySelector<HTMLElement>('#pb-log');
		const url = con.querySelector<HTMLElement>('#pb-url');
		const name = con.querySelector<HTMLElement>('#pb-name');
		const sector = con.querySelector<HTMLElement>('#pb-sector');
		const shots = Array.from(
			con.querySelectorAll<HTMLElement>('[data-pb-shot]')
		);
		if (data.length && cmd && fill && log && url && name && sector) {
			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			let i = 0;
			let running = false;
			let visible = false;

			const addLog = (text: string, cls = 'info') => {
				const p = document.createElement('p');
				p.className = cls;
				p.textContent = text;
				log.appendChild(p);
				while (log.children.length > 4) log.removeChild(log.firstChild!);
			};

			const deploy = async () => {
				if (running) return;
				running = true;
				while (visible) {
					const d = data[i % data.length];
					i++;
					const command = `swizel deploy ${d.slug} --prod`;
					cmd.textContent = '';
					fill.style.width = '0%';
					if (reduce) {
						cmd.textContent = command;
					} else {
						for (let c = 0; c <= command.length; c++) {
							cmd.textContent = command.slice(0, c);
							await sleep(26);
						}
					}
					addLog('› building…');
					fill.style.width = '38%';
					await sleep(reduce ? 120 : 620);
					addLog('› running 214 tests… all passed', 'ok');
					fill.style.width = '72%';
					await sleep(reduce ? 120 : 620);
					fill.style.width = '100%';
					addLog(`✓ live at ${d.host}`, 'accent');
					// swap the preview to the freshly "deployed" product
					shots.forEach((s) =>
						s.classList.toggle('is-on', s.dataset.pbShot === d.slug)
					);
					url.textContent = `https://${d.host}`;
					name.textContent = d.name;
					sector.textContent = d.sector;
					await sleep(reduce ? 800 : 2600);
				}
				running = false;
			};

			const io = new IntersectionObserver(
				(entries) =>
					entries.forEach((e) => {
						visible = e.isIntersecting;
						if (visible) deploy();
					}),
				{ threshold: 0.3 }
			);
			io.observe(con);
		}
	}

	// ── git graph: the branch line draws itself into view ──
	const git = body.querySelector<HTMLElement>('#bb-git');
	if (git) {
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) {
						git.classList.add('is-drawn');
						io.unobserve(git);
					}
				}),
			{ threshold: 0.25 }
		);
		io.observe(git);
	}
}
