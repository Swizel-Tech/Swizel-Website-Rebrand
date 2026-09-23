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
				s.textContent = sparks[i % sparks.length]!;
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
					msg.textContent = steps[i] ?? '';
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
					steps[i - 1]!.classList.remove('is-running');
					steps[i - 1]!.classList.add('is-done');
				}
				if (i >= steps.length) {
					pass?.classList.add('is-on');
					timer = window.setTimeout(cycle, 2600);
					return;
				}
				steps[i]!.classList.add('is-running');
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
								select(tabs[(i + 1) % tabs.length]!);
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
		// ── the rail: fold it away, or pick a deployment yourself ──────
		// On a phone the rail is a drawer over the preview, so the console
		// opens folded — otherwise the list would cover the site on load.
		const narrow = () => window.matchMedia('(max-width: 880px)').matches;
		if (narrow()) con.classList.add('is-folded');

		const taught = () => con.classList.add('is-taught');
		con.querySelectorAll<HTMLButtonElement>('[data-pb-fold]').forEach((b) =>
			b.addEventListener('click', () => {
				taught();
				con.classList.toggle('is-folded');
			})
		);
		// tapping the scrim (anywhere outside the drawer) closes it
		con.addEventListener('click', (e) => {
			if (!narrow() || con.classList.contains('is-folded')) return;
			const t = e.target as HTMLElement | null;
			if (t && !t.closest('.pb-rail') && !t.closest('[data-pb-fold]')) {
				con.classList.add('is-folded');
			}
		});
		const railRows = Array.from(
			con.querySelectorAll<HTMLButtonElement>('[data-pb-pick]')
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
				// the log is a strip now, not a column: it holds the last
				// three lines and the newest is the one you can always see
				while (log.children.length > 3) log.removeChild(log.firstChild!);
			};

			// a click on the rail jumps the queue to that deployment
			railRows.forEach((r, n) =>
				r.addEventListener('click', () => {
					taught();
					i = n;
					railRows.forEach((o, m) => o.classList.toggle('is-on', m === n));
					// on a phone the rail sits over the preview, so get out
					// of the way once a site has been chosen
					if (narrow()) con.classList.add('is-folded');
				})
			);

			const deploy = async () => {
				if (running) return;
				running = true;
				while (visible) {
					const d = data[i % data.length]!;
					railRows.forEach((r, n) =>
						r.classList.toggle('is-on', n === i % data.length)
					);
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

	// ── the contact sheet: a frame opens full size ──────────────────
	// Keyboard first — arrows step, Escape closes, focus returns to the
	// frame you came from — with a swipe on top for a thumb.
	const sheet = body.querySelector<HTMLElement>('[data-sheet]');
	const lb = body.querySelector<HTMLElement>('[data-lb]');
	const raw = body.querySelector('[data-sheet-data]')?.textContent;
	if (sheet && lb && raw) {
		type Shot = { src: string; name: string; w: number; h: number; note: string };
		let shots: Shot[] = [];
		try {
			shots = JSON.parse(raw);
		} catch {
			shots = [];
		}

		const img = lb.querySelector<HTMLImageElement>('[data-lb-img]');
		const nameEl = lb.querySelector<HTMLElement>('[data-lb-name]');
		const nEl = lb.querySelector<HTMLElement>('[data-lb-n]');
		const noteEl = lb.querySelector<HTMLElement>('[data-lb-note]');
		const pad = (n: number) => String(n).padStart(2, '0');

		let at = 0;
		let opener: HTMLElement | null = null;

		const paint = () => {
			const sh = shots[at];
			if (!sh || !img) return;
			img.src = sh.src;
			img.alt = sh.note;
			img.width = sh.w;
			img.height = sh.h;
			if (nameEl) nameEl.textContent = sh.name;
			if (nEl) nEl.textContent = `${pad(at + 1)} / ${pad(shots.length)}`;
			if (noteEl) noteEl.textContent = sh.note;
		};

		const step = (d: number) => {
			at = (at + d + shots.length) % shots.length;
			paint();
		};

		const close = () => {
			lb.hidden = true;
			document.body.style.overflow = '';
			opener?.focus();
			opener = null;
		};

		const open = (i: number, from: HTMLElement) => {
			at = i;
			opener = from;
			paint();
			lb.hidden = false;
			document.body.style.overflow = 'hidden';
			lb.querySelector<HTMLButtonElement>('.bb-lb-x')?.focus();
		};

		sheet.querySelectorAll<HTMLButtonElement>('[data-shot]').forEach((b) =>
			b.addEventListener('click', () => open(Number(b.dataset.shot) || 0, b))
		);
		lb.querySelectorAll<HTMLButtonElement>('[data-lb-close]').forEach((b) =>
			b.addEventListener('click', close)
		);
		lb.querySelectorAll<HTMLButtonElement>('[data-lb-step]').forEach((b) =>
			b.addEventListener('click', () => step(Number(b.dataset.lbStep) || 1))
		);

		document.addEventListener('keydown', (e) => {
			if (lb.hidden) return;
			if (e.key === 'Escape') {
				e.preventDefault();
				close();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				step(1);
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				step(-1);
			}
		});

		// the same flick the hero's machine answers to
		let sx = 0;
		let sy = 0;
		lb.addEventListener(
			'touchstart',
			(e) => {
				const t = e.touches[0];
				if (!t) return;
				sx = t.clientX;
				sy = t.clientY;
			},
			{ passive: true }
		);
		lb.addEventListener(
			'touchend',
			(e) => {
				const t = e.changedTouches[0];
				if (!t) return;
				const dx = t.clientX - sx;
				const dy = t.clientY - sy;
				if (Math.abs(dx) < 46 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
				step(dx < 0 ? 1 : -1);
			},
			{ passive: true }
		);
	}

	// ── the review thread ───────────────────────────────────────────
	// One review open at a time, advancing on its own, and stopping the
	// moment somebody takes an interest — a carousel that keeps moving
	// under your hand is a carousel you cannot read.
	const thread = body.querySelector<HTMLElement>('[data-thread]');
	const threadRaw = body.querySelector('[data-thread-data]')?.textContent;
	if (thread && threadRaw) {
		type Review = { name: string; img: string; pr: string; add: string; cut: string; body: string };
		let list: Review[] = [];
		try {
			list = JSON.parse(threadRaw);
		} catch {
			list = [];
		}
		const rows = Array.from(thread.querySelectorAll<HTMLButtonElement>('[data-review]'));
		const open = thread.querySelector<HTMLElement>('[data-open-review]');
		const q = <T extends HTMLElement>(sel: string) => thread.querySelector<T>(sel);

		if (list.length && rows.length && open) {
			let at = 0;
			let timer = 0;
			let held = false;

			const paint = () => {
				const r = list[at];
				if (!r) return;
				const img = q<HTMLImageElement>('[data-rv-img]');
				if (img) {
					img.src = r.img;
					img.alt = '';
				}
				const set = (sel: string, v: string) => {
					const el = q(sel);
					if (el) el.textContent = v;
				};
				set('[data-rv-name]', r.name);
				set('[data-rv-body]', r.body);
				set('[data-rv-add]', r.add);
				set('[data-rv-cut]', r.cut);
				set('[data-rv-pr]', r.pr);

				rows.forEach((b, i) => {
					const on = i === at;
					b.classList.toggle('is-on', on);
					b.setAttribute('aria-selected', on ? 'true' : 'false');
					if (on) {
						// restart the fill bar from zero for the new row
						const bar = b.querySelector<HTMLElement>('.bb-qbar i');
						if (bar) {
							bar.style.animation = 'none';
							void bar.offsetWidth;
							bar.style.animation = '';
						}
					}
				});

				open.classList.remove('is-swap');
				void open.offsetWidth;
				open.classList.add('is-swap');
			};

			const stop = () => {
				if (timer) window.clearInterval(timer);
				timer = 0;
			};
			const start = () => {
				stop();
				if (reduce || held) return;
				timer = window.setInterval(() => {
					at = (at + 1) % list.length;
					paint();
				}, 6000);
			};
			const go = (i: number) => {
				at = (i + list.length) % list.length;
				paint();
				start();
			};

			rows.forEach((b, i) => b.addEventListener('click', () => go(i)));
			thread.addEventListener('pointerenter', () => {
				held = true;
				stop();
			});
			thread.addEventListener('pointerleave', () => {
				held = false;
				start();
			});
			thread.addEventListener('focusin', () => {
				held = true;
				stop();
			});
			thread.addEventListener('focusout', (e) => {
				if (thread.contains(e.relatedTarget as Node)) return;
				held = false;
				start();
			});
			// arrow keys walk the queue
			thread.addEventListener('keydown', (e) => {
				const ev = e as KeyboardEvent;
				if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
				ev.preventDefault();
				go(at + (ev.key === 'ArrowDown' ? 1 : -1));
				rows[at]?.focus();
			});

			// nothing runs until the thread is actually on screen
			if ('IntersectionObserver' in window) {
				new IntersectionObserver(
					(entries) => {
						const en = entries[0];
						if (!en) return;
						if (en.isIntersecting) start();
						else stop();
					},
					{ threshold: 0.3 }
				).observe(thread);
			} else {
				start();
			}
		}
	}
}