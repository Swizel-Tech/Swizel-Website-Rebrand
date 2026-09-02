// Campus world: scroll reveals, XP counters, the quest bar fill with
// popping level nodes, the achievements unlock sequence and the portfolio
// Show & Tell projector.
export function initCampusBody() {
	const body = document.querySelector('.cbody');
	if (!body) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── the Show & Tell projector: slides click over on a loop ──
	const show = body.querySelector<HTMLElement>('#cp-show');
	if (show && !show.dataset.csBound) {
		show.dataset.csBound = '1';
		const items = Array.from(
			show.querySelectorAll<HTMLElement>('[data-cs-item]')
		).map((el) => ({
			img: el.dataset.img || '',
			name: el.dataset.name || '',
			meta: el.dataset.meta || '',
			color: el.dataset.color || '',
		}));
		const imgs = [
			show.querySelector<HTMLImageElement>('#cp-show-a')!,
			show.querySelector<HTMLImageElement>('#cp-show-b')!,
		];
		const name = show.querySelector<HTMLElement>('#cp-show-name')!;
		const meta = show.querySelector<HTMLElement>('#cp-show-meta')!;
		const count = show.querySelector<HTMLElement>('#cp-show-count')!;
		const tape = show.querySelector<HTMLElement>('#cp-show-tape')!;
		const clicks = Array.from(
			show.querySelectorAll<HTMLElement>('[data-cs-go]')
		);
		let cur = 0;
		let front = 0;
		let timer = 0;

		const goTo = (n: number) => {
			cur = (n + items.length) % items.length;
			const it = items[cur]!;
			// the projector flashes as the slide clicks over
			show.classList.add('cf-click-over');
			const back = imgs[1 - front]!;
			back.src = it.img;
			back.alt = it.name;
			window.setTimeout(() => {
				back.classList.add('is-on');
				imgs[front]!.classList.remove('is-on');
				front = 1 - front;
				show.style.setProperty('--c', it.color);
				name.textContent = it.name;
				meta.textContent = it.meta;
				count.textContent = `Slide ${cur + 1} / ${items.length}`;
				tape.classList.remove('cf-pop');
				void tape.offsetWidth;
				tape.classList.add('cf-pop');
				clicks.forEach((t, ti) => t.classList.toggle('is-on', ti === cur));
				show.classList.remove('cf-click-over');
			}, 160);
		};
		const start = () => {
			if (timer || reduce || items.length < 2) return;
			timer = window.setInterval(() => goTo(cur + 1), 3400);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		clicks.forEach((t) =>
			t.addEventListener('click', () => {
				stop();
				goTo(Number(t.dataset.csGo || '0'));
				start();
			})
		);
		show.addEventListener('pointerenter', stop);
		show.addEventListener('pointerleave', start);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.25 }
		);
		io.observe(show);
	}

	// ── scroll reveals ──
	const reveals = Array.from(body.querySelectorAll<HTMLElement>('.cp-rev'));
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
			if (reduce || t === 0) {
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

	// ── the teacher wrote today's date on the whiteboard ──
	const boardDate = body.querySelector<HTMLElement>('#cp-board-date');
	if (boardDate) {
		boardDate.textContent = new Date().toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}

	// ── the chalkboard rotates its facts; the chalk sticks page it ──
	const chalk = body.querySelector<HTMLElement>('#cp-chalk');
	if (chalk) {
		const facts = Array.from(chalk.querySelectorAll<HTMLElement>('.cp-fact'));
		const count = chalk.querySelector<HTMLElement>('#cp-chalk-count');
		let i = 0;
		let timer = 0;
		const show = (n: number) => {
			facts[i]!.classList.remove('is-live');
			i = (n + facts.length) % facts.length;
			facts[i]!.classList.add('is-live');
			if (count) count.textContent = `${i + 1} / ${facts.length}`;
		};
		const start = () => {
			if (timer || reduce || facts.length < 2) return;
			timer = window.setInterval(() => show(i + 1), 5200);
		};
		const stop = () => {
			window.clearInterval(timer);
			timer = 0;
		};
		// the chalk pieces in the tray are the prev / next buttons
		chalk.querySelector('#cp-chalk-prev')?.addEventListener('click', () => {
			stop();
			show(i - 1);
			start();
		});
		chalk.querySelector('#cp-chalk-next')?.addEventListener('click', () => {
			stop();
			show(i + 1);
			start();
		});
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => (e.isIntersecting ? start() : stop())),
			{ threshold: 0.3 }
		);
		io.observe(chalk);
		chalk.addEventListener('pointerenter', stop);
		chalk.addEventListener('pointerleave', start);
	}

	// ── the board: a week you can actually tick off ──
	const todoList = body.querySelector<HTMLElement>('[data-todos]');
	if (todoList && !todoList.dataset.cpBound) {
		todoList.dataset.cpBound = '1';
		const pins = Array.from(todoList.querySelectorAll<HTMLButtonElement>('[data-todo]'));
		const fill = body.querySelector<HTMLElement>('[data-week-fill]');
		const label = body.querySelector<HTMLElement>('[data-week-label]');
		const reset = body.querySelector<HTMLButtonElement>('[data-week-reset]');
		// what the board says back to you, so ticking the last one is worth it
		const lines = [
			'nothing done yet. the week is young',
			'one down. keep going',
			'halfway to a good week',
			'more done than not. nice',
			'one left. finish it',
			'all done — go and play football',
		];

		const paint = () => {
			const done = pins.filter((p) => p.classList.contains('is-done')).length;
			const pct = pins.length ? (done / pins.length) * 100 : 0;
			if (fill) fill.style.width = `${pct}%`;
			if (label) {
				const note = done === pins.length ? lines[5] : lines[Math.min(done, 4)];
				label.textContent = `${done} of ${pins.length} done — ${note}`;
			}
		};

		pins.forEach((pin) =>
			pin.addEventListener('click', () => {
				const done = pin.classList.toggle('is-done');
				pin.setAttribute('aria-pressed', done ? 'true' : 'false');
				paint();
			})
		);
		reset?.addEventListener('click', () => {
			pins.forEach((p) => {
				p.classList.remove('is-done');
				p.setAttribute('aria-pressed', 'false');
			});
			paint();
		});
		paint();
	}

	// ── the pop quiz: one question at a time, red pen at the end ──
	const quiz = body.querySelector<HTMLElement>('[data-quiz]');
	if (quiz && !quiz.dataset.cpBound) {
		quiz.dataset.cpBound = '1';
		const qs = Array.from(quiz.querySelectorAll<HTMLElement>('[data-q]'));
		const dots = Array.from(quiz.querySelectorAll<HTMLElement>('.cp-quiz-dots i'));
		const result = quiz.querySelector<HTMLElement>('[data-result]');
		const grade = quiz.querySelector<HTMLElement>('[data-grade]');
		const note = quiz.querySelector<HTMLElement>('[data-note]');
		const score = quiz.querySelector<HTMLElement>('[data-score]');
		const retake = quiz.querySelector<HTMLButtonElement>('[data-retake]');
		// grade, then what the teacher wrote in the margin
		const marks: [string, string][] = [
			['SEE ME', 'Come and sit at the front. We will start again from the top.'],
			['D', 'A start. Most of this is on the chalkboard two sections up.'],
			['C', 'Passable. Read it once more and try again.'],
			['B', 'Solid. You would keep up here.'],
			['A', 'Very good. One slip, and everybody slips.'],
			['A+', 'Full marks. Show-off. Come and sit the real one.'],
		];
		let at = 0;
		let right = 0;

		const showQ = (n: number) => {
			qs.forEach((q, i) => q.classList.toggle('is-live', i === n));
			dots.forEach((d, i) => d.classList.toggle('is-on', i === n));
		};

		const finish = () => {
			qs.forEach((q) => q.classList.remove('is-live'));
			const [g, n] = marks[right] ?? marks[0]!;
			if (grade) grade.textContent = g;
			if (note) note.textContent = `${right} of ${qs.length}. ${n}`;
			result?.removeAttribute('hidden');
			dots.forEach((d) => d.classList.remove('is-on'));
		};

		qs.forEach((q, qi) => {
			q.querySelectorAll<HTMLButtonElement>('.cp-opt').forEach((opt) => {
				opt.addEventListener('click', () => {
					if (q.dataset.answered) return;
					q.dataset.answered = '1';
					const correct = opt.dataset.right === '1';
					if (correct) {
						right += 1;
						dots[qi]?.classList.add('is-hit');
					}
					q.querySelectorAll<HTMLButtonElement>('.cp-opt').forEach((o) => {
						o.disabled = true;
						if (o.dataset.right === '1') o.classList.add('is-right');
						else if (o === opt) o.classList.add('is-wrong');
					});
					q.querySelector('.cp-q-why')?.removeAttribute('hidden');
					if (score) score.textContent = `${right * 100} XP`;
					// a beat to read the red pen before the page turns
					window.setTimeout(() => {
						at = qi + 1;
						if (at >= qs.length) finish();
						else showQ(at);
					}, correct ? 1150 : 1900);
				});
			});
		});

		retake?.addEventListener('click', () => {
			at = 0;
			right = 0;
			qs.forEach((q) => {
				delete q.dataset.answered;
				q.querySelector('.cp-q-why')?.setAttribute('hidden', '');
				q.querySelectorAll<HTMLButtonElement>('.cp-opt').forEach((o) => {
					o.disabled = false;
					o.classList.remove('is-right', 'is-wrong');
				});
			});
			dots.forEach((d) => d.classList.remove('is-hit'));
			result?.setAttribute('hidden', '');
			if (score) score.textContent = '0 XP';
			showQ(0);
		});
	}

	// ── quest bar + achievements unlock when they enter view ──
	['#cp-questline', '#cp-achvs'].forEach((sel) => {
		const el = body.querySelector<HTMLElement>(sel);
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-on');
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.3 }
		);
		io.observe(el);
	});
}
