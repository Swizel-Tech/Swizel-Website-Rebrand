// The /programs application page: picking a track, the signing pen, and the
// application form. It lives here rather than in the page so that a swup
// navigation re-binds it, instead of only a hard refresh.
import toaster from './toast';

export function initProgramsPage() {
	const page = document.querySelector<HTMLElement>('.pg');
	if (!page || page.dataset.pgBound) return;
	page.dataset.pgBound = '1';

	const toast = toaster();



		const form = document.querySelector<HTMLFormElement>('#pg-form');
		const submit = document.querySelector<HTMLButtonElement>('#pg-submit');

		// clicking a track card's link pre-selects that track in the form
		document.querySelectorAll<HTMLElement>('[data-pick-track]').forEach((el) => {
			el.addEventListener('click', () => {
				const sel = form?.querySelector<HTMLSelectElement>('select[name="track"]');
				if (sel) sel.value = el.dataset.pickTrack || '';
			});
		});

		// ── picking a track ──
		// The two cards swap places: the chosen one comes to the front, opens up
		// and grows its apply button; the other steps back but stays clickable.
		const tracksWrap = document.querySelector<HTMLElement>('#pg-tracks');
		const focusBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-focus]'));
		const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-track]'));

		const setFocus = (id: string | null, scroll = true) => {
			if (!tracksWrap) return;
			if (id) tracksWrap.dataset.focus = id;
			else delete tracksWrap.dataset.focus;
			cards.forEach((c) => c.classList.toggle('is-focus', !!id && c.dataset.track === id));
			focusBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === id)));
			const sel = form?.querySelector<HTMLSelectElement>('select[name="track"]');
			const card = cards.find((c) => c.dataset.track === id);
			if (sel && card) {
				const nm = card.querySelector('.pg-track-name')?.textContent?.trim();
				if (nm) sel.value = nm;
			}
			if (scroll && card) {
				window.setTimeout(
					() => card.scrollIntoView({ block: 'center', behavior: 'smooth' }),
					60
				);
			}
		};

		focusBtns.forEach((b) =>
			b.addEventListener('click', () => {
				const id = b.dataset.focus || null;
				setFocus(tracksWrap?.dataset.focus === id ? null : id);
			})
		);
		document.querySelectorAll<HTMLElement>('[data-focus-clear]').forEach((b) =>
			b.addEventListener('click', () => setFocus(null, false))
		);
		// clicking the card that stepped back brings it forward instead
		cards.forEach((c) =>
			c.addEventListener('click', (e) => {
				if (!tracksWrap?.dataset.focus) return;
				if (c.classList.contains('is-focus')) return;
				if ((e.target as HTMLElement).closest('a,button')) return;
				setFocus(c.dataset.track || null);
			})
		);
		// arriving on /programs#nysc opens that track straight away
		const fromHash = location.hash.replace('#', '');
		if (fromHash === 'nysc' || fromHash === 'internship') setFocus(fromHash, false);

		// the pen signs itself when the section arrives
		const pen = document.querySelector<HTMLElement>('[data-pen]');
		if (pen) {
			const io = new IntersectionObserver(
				(entries) =>
					entries.forEach((en) => {
						if (!en.isIntersecting) return;
						pen.classList.add('is-on');
						io.disconnect();
					}),
				{ threshold: 0.4 }
			);
			io.observe(pen);
		}

		const LABELS: Record<string, string> = {
			fullName: 'Full name',
			email: 'Email',
			phone: 'Phone',
			track: 'Track',
			institution: 'Institution',
			course: 'Course of study',
			level: 'Level',
			discipline: 'Discipline',
			address: 'Home address',
			startDate: 'Available from',
			portfolio: 'Portfolio',
			built: 'Something they built',
			goal: 'What they hope to achieve',
		};

		form?.addEventListener('submit', (e) => {
			e.preventDefault();
			if (!form || !submit) return;

			const data = new FormData(form);
			const values: Record<string, string> = {};
			LABELS && Object.keys(LABELS).forEach((k) => {
				values[k] = String(data.get(k) ?? '').trim();
			});

			// ── validation ──
			// Every field is checked for the shape of answer it actually wants, so
			// a phone number cannot arrive in the name box and a name cannot arrive
			// in the phone box. The first thing that is wrong is named out loud and
			// scrolled to, rather than the whole form going red at once.
			const NAMEISH = /^[A-Za-zÀ-ÿ'’.\-\s]{2,}$/;
			const rules: { name: string; test: (v: string) => boolean; msg: string }[] = [
				{ name: 'fullName', test: (v) => NAMEISH.test(v) && v.trim().split(/\s+/).length >= 2, msg: 'Please give your full name in letters, first and last.' },
				{ name: 'email', test: (v) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v), msg: 'That email address does not look right.' },
				{ name: 'phone', test: (v) => /^[+]?[\d][\d\s()\-]{7,19}$/.test(v) && (v.match(/\d/g) || []).length >= 8, msg: 'Please give a phone number we can actually reach, digits only.' },
				{ name: 'track', test: (v) => !!v, msg: 'Choose the track you are applying for.' },
				{ name: 'institution', test: (v) => NAMEISH.test(v) && v.trim().length >= 3, msg: 'Your institution name should be words, not numbers.' },
				{ name: 'course', test: (v) => NAMEISH.test(v) && v.trim().length >= 3, msg: 'Your course of study should be words, not numbers.' },
				{ name: 'level', test: (v) => !!v, msg: 'Choose your level.' },
				{ name: 'discipline', test: (v) => !!v, msg: 'Choose the discipline you want.' },
				{ name: 'address', test: (v) => v.trim().length >= 8 && /[A-Za-z]/.test(v), msg: 'Please give an address we could find, not just a number.' },
				{ name: 'startDate', test: (v) => v.trim().length >= 3, msg: 'Tell us when you can start.' },
				{ name: 'portfolio', test: (v) => !v || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v), msg: 'That link does not look like a web address.' },
				{ name: 'built', test: (v) => v.trim().split(/\s+/).length >= 12, msg: 'Tell us a little more about what you built, a dozen words at least.' },
				{ name: 'goal', test: (v) => v.trim().split(/\s+/).length >= 12, msg: 'Tell us a little more about what you want out of this.' },
			];

			form.querySelectorAll<HTMLElement>('.pg-field').forEach((f) => {
				f.classList.remove('is-bad');
				f.querySelector('.pg-err')?.remove();
			});

			let firstBad: HTMLElement | null = null;
			let firstMsg = '';
			for (const r of rules) {
				const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
					`[name="${r.name}"]`
				);
				if (!el) continue;
				const v = (values[r.name] ?? '').trim();
				const required = el.hasAttribute('required');
				const problem = required ? !v || !r.test(v) : !!v && !r.test(v);
				if (!problem) continue;
				const field = el.closest<HTMLElement>('.pg-field');
				if (field) {
					field.classList.add('is-bad');
					const note = document.createElement('span');
					note.className = 'pg-err';
					note.textContent = v ? r.msg : 'This one is required.';
					field.appendChild(note);
				}
				if (!firstBad) {
					firstBad = field || el;
					firstMsg = v ? r.msg : 'Please fill in every required field.';
				}
			}
			if (firstBad) {
				toast('danger', firstMsg);
				(firstBad as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
				(firstBad as HTMLElement).querySelector<HTMLElement>('input,select,textarea')?.focus({ preventScroll: true });
				return;
			}

			const message = Object.keys(LABELS)
				.map((k) => `${LABELS[k]}: ${values[k] || 'Not given'}`)
				.join('\n');

			const original = submit.textContent;
			submit.disabled = true;
			submit.textContent = 'Sending…';

			import('@emailjs/browser')
				.then(({ default: emailjs }) => {
					emailjs.init('6seJt_G90tNz7cnD5');
					return emailjs.send('service_xtbicfb', 'template_gp3qzsk', {
					from_name: values.fullName,
					name: values.fullName,
					email: values.email,
					reply_to: values.email,
					phoneNumber: values.phone,
					to_email: 'contact@swizel.co',
					subject: `Application: ${values.track} · ${values.fullName}`,
						message: `NEW APPLICATION\n\n${message}`,
					});
				})
				.then(() => {
					toast('success', 'Application sent to contact@swizel.co. We read every one, and we will get back to you.');
					form.reset();
				})
				.catch((err) => {
					console.error('[application]', err);
					toast(
						'danger',
						'That did not go through. Please email contact@swizel.co directly, or try the live chat.'
					);
				})
				.finally(() => {
					submit.disabled = false;
					submit.textContent = original;
				});
		});

}
