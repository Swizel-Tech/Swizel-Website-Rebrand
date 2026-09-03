// Contact · Campus world — the front office.
// The sheet is only worth building if it is a pleasure to fill in: ticking a
// box writes your opening line, the meter fills as you go, the encouragement
// changes with it, and handing it in lands on a real desk.
import toaster from './toast';

const CHEERS = [
	'Nothing filled in yet. Start anywhere you like.',
	'Good start. Three to go, and none of them are hard.',
	'Halfway. The next one is only your email.',
	'Nearly there. Only the interesting box left.',
	'That is the whole sheet. Hand it in and it is on our desk.',
];

export function initContactCampus() {
	const root = document.querySelector<HTMLElement>('.ck');
	if (!root || root.dataset.ckBound) return;
	root.dataset.ckBound = '1';

	const toast = toaster();
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── reveals ──
	const revs = Array.from(root.querySelectorAll<HTMLElement>('.cp-rev'));
	if (revs.length) {
		const io = new IntersectionObserver(
			(es) =>
				es.forEach((e) => {
					if (!e.isIntersecting) return;
					e.target.classList.add('is-on');
					io.unobserve(e.target);
				}),
			{ threshold: 0.15 }
		);
		revs.forEach((r) => io.observe(r));
	}

	// ── the chalk counters ──
	root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
		const to = Number(el.dataset.count || '0');
		const sfx = el.dataset.suffix || '';
		if (reduce) {
			el.textContent = to + sfx;
			return;
		}
		const io = new IntersectionObserver(
			(es) =>
				es.forEach((e) => {
					if (!e.isIntersecting) return;
					io.disconnect();
					const t0 = performance.now();
					const tick = (now: number) => {
						const p = Math.min(1, (now - t0) / 1100);
						el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + sfx;
						if (p < 1) requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				}),
			{ threshold: 0.5 }
		);
		io.observe(el);
	});

	// ── the clock on the visitor's pass ──
	const clock = root.querySelector<HTMLElement>('[data-ck-clock]');
	if (clock) {
		const tick = () => {
			try {
				clock.textContent = new Intl.DateTimeFormat('en-GB', {
					timeZone: 'Africa/Lagos',
					hour: '2-digit',
					minute: '2-digit',
				}).format(new Date());
			} catch (e) {}
		};
		tick();
		const w = window as any;
		if (w.__ckClock) clearInterval(w.__ckClock);
		w.__ckClock = window.setInterval(tick, 30000);
	}

	// ── the sheet ──
	const form = root.querySelector<HTMLFormElement>('#ck-contact');
	if (!form) return;
	const msg = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
	if (!msg) return;
	const btn = root.querySelector<HTMLButtonElement>('#ck-send');
	const stamp = root.querySelector<HTMLElement>('#ck-stamp');
	const fill = root.querySelector<HTMLElement>('[data-ck-fill]');
	const done = root.querySelector<HTMLElement>('[data-ck-done]');
	const cheer = root.querySelector<HTMLElement>('[data-ck-cheer]');
	const hint = root.querySelector<HTMLElement>('[data-ck-hint]');

	const val = (n: string) =>
		(form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value || '').trim();

	const score = () => {
		const filled = ['name', 'email', 'phoneNumber', 'message'].filter(
			(n) => val(n).length > 1
		).length;
		if (fill) fill.style.width = `${(filled / 4) * 100}%`;
		if (done) done.textContent = String(filled);
		if (cheer) cheer.textContent = CHEERS[Math.min(filled, 4)]!;
	};
	form.addEventListener('input', score);
	score();

	// ticking a box writes the first line for you
	root.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((p) =>
		p.addEventListener('click', () => {
			const seed = p.dataset.seed || '';
			const on = p.classList.toggle('is-on');
			if (on) {
				const body = msg.value.trim();
				if (!body) msg.value = seed;
				else if (!body.startsWith(seed)) msg.value = `${seed}\n\n${body}`;
				if (hint) hint.textContent = 'Line started for you. Take it from there, in your own words.';
				msg.focus();
				msg.setSelectionRange(msg.value.length, msg.value.length);
			} else if (msg.value.startsWith(seed)) {
				msg.value = msg.value.slice(seed.length).trimStart();
			}
			score();
		})
	);

	root
		.querySelector<HTMLElement>('[data-ck-stamp-close]')
		?.addEventListener('click', () => {
			if (stamp) stamp.hidden = true;
		});

	// ── handing it in ──
	const NAMEISH = /^[A-Za-zÀ-ÿ'’.\-\s]{2,}$/;
	const required = ['name', 'email', 'message'];

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		form.querySelectorAll<HTMLElement>('.ck-field').forEach((f) => {
			f.classList.remove('is-bad');
			f.querySelector('.ck-err')?.remove();
		});

		const phone = val('phoneNumber');
		const rules: [string, boolean, string][] = [
			['name', NAMEISH.test(val('name')) && val('name').length >= 3, 'Your name, in letters please.'],
			['email', /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(val('email')), 'That email address will not reach you.'],
			[
				'phoneNumber',
				!phone ||
					(/^[+]?[\d][\d\s()\-]{7,19}$/.test(phone) && (phone.match(/\d/g) || []).length >= 8),
				'That does not look like a phone number.',
			],
			[
				'message',
				val('message').split(/\s+/).filter(Boolean).length >= 8,
				'A sentence or two more, so we can actually be useful.',
			],
		];

		let bad: HTMLElement | null = null;
		let badMsg = '';
		for (const [n, ok, m] of rules) {
			if (ok) continue;
			const field = form
				.querySelector<HTMLElement>(`[name="${n}"]`)
				?.closest<HTMLElement>('.ck-field');
			const empty = required.includes(n) && !val(n);
			if (field) {
				field.classList.add('is-bad');
				const note = document.createElement('span');
				note.className = 'ck-err';
				note.textContent = empty ? 'This one is required.' : m;
				field.appendChild(note);
			}
			if (!bad && field) {
				bad = field;
				badMsg = empty ? 'One box is still empty.' : m;
			}
		}
		if (bad) {
			toast('danger', badMsg);
			bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
			return;
		}

		const label = btn?.textContent;
		if (btn) {
			btn.disabled = true;
			btn.textContent = 'Handing it in…';
		}
		try {
			const { default: emailjs } = await import('@emailjs/browser');
			emailjs.init('6seJt_G90tNz7cnD5');
			await emailjs.send('service_xtbicfb', 'template_gp3qzsk', {
				from_name: val('name'),
				name: val('name'),
				email: val('email'),
				reply_to: val('email'),
				phoneNumber: phone || 'N/A',
				to_email: 'contact@swizel.co',
				subject: `New enquiry from ${val('name')}`,
				message: `NEW ENQUIRY (campus contact sheet)\n\nName: ${val('name')}\nEmail: ${val('email')}\nPhone: ${phone || 'Not given'}\nPage: ${window.location.href}\n\n${val('message')}`,
			});
			form.reset();
			root.querySelectorAll('.ck-pick.is-on').forEach((p) => p.classList.remove('is-on'));
			score();
			if (stamp) stamp.hidden = false;
		} catch (err) {
			console.log(err);
			toast(
				'danger',
				'That did not send. Please email contact@swizel.co directly, or use the live chat.'
			);
		} finally {
			if (btn) {
				btn.disabled = false;
				btn.textContent = label || 'Hand it in';
			}
		}
	});
}
