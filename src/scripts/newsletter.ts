// Every "join the list" box on the site, handled in one place.
//
// There were six of them and they did not agree. The footer's checked
// that the box was not empty. The campus slip had its own regex. And the
// four on the blog — boardroom, builder, founder and studio — carried
// `data-netlify="true"`, which is the attribute Netlify's form service
// reads. The site is on Vercel. Nothing was listening, so those four
// took an address, appeared to work, and dropped it on the floor.
//
// Now: one validator, one honeypot, one send, one message. A form opts in
// by carrying [data-newsletter]; the handler finds its own input, button
// and status line inside itself, so the markup can look like whatever
// that world's design calls for.
import { checkEmail } from './validate';

interface Wired {
	form: HTMLFormElement;
	input: HTMLInputElement;
	btn: HTMLButtonElement | null;
	note: HTMLElement | null;
}

const say = (w: Wired, text: string, bad = false) => {
	if (!w.note) return;
	w.note.textContent = text;
	if (bad) w.note.setAttribute('data-bad', '');
	else w.note.removeAttribute('data-bad');
};

export function initNewsletter() {
	const forms = Array.from(
		document.querySelectorAll<HTMLFormElement>('[data-newsletter]')
	);
	if (!forms.length) return;

	forms.forEach((form) => {
		if (form.dataset.newsletterReady === '1') return;
		form.dataset.newsletterReady = '1';

		const input = form.querySelector<HTMLInputElement>('input[type="email"], input[name="email"]');
		if (!input) return;

		// The field is type="email", so the browser refuses the submit
		// itself and shows its own grey bubble — which means our handler
		// never runs and our own wording never appears. One voice, ours.
		form.noValidate = true;

		// Most of these forms were never given anywhere to say anything,
		// because nothing was ever going to answer them. Rather than edit
		// four different designs, a line is made here when one is missing.
		let note =
			form.querySelector<HTMLElement>('[data-newsletter-note]') ??
			form.parentElement?.querySelector<HTMLElement>('[data-newsletter-note]') ??
			null;
		if (!note) {
			note = document.createElement('span');
			note.className = 'nl-note';
			note.setAttribute('data-newsletter-note', '');
			note.setAttribute('role', 'status');
			form.insertAdjacentElement('afterend', note);
		}

		const w: Wired = {
			form,
			input,
			btn: form.querySelector<HTMLButtonElement>('button[type="submit"], button'),
			note,
		};

		form.addEventListener('submit', async (e) => {
			e.preventDefault();

			// the invisible box: a bot fills everything, a person fills none
			const pot = form.querySelector<HTMLInputElement>('input[name="bot-field"]');
			if (pot?.value.trim()) {
				form.reset();
				return;
			}

			const address = w.input.value.trim();
			const bad = checkEmail(address);
			if (bad) {
				say(w, bad, true);
				w.input.setAttribute('aria-invalid', 'true');
				w.input.focus();
				return;
			}
			w.input.removeAttribute('aria-invalid');

			const label = w.btn?.textContent ?? '';
			say(w, 'Signing you up…');
			if (w.btn) w.btn.disabled = true;

			try {
				// our own endpoint, which sends from contact@swizel.co over the
				// domain's SMTP — and sends the person a themed confirmation.
				const where = form.dataset.newsletter || 'site';
				const res = await fetch('/api/subscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						email: address,
						source: where,
						page: window.location.pathname,
						botField: pot?.value ?? '',
					}),
				});
				const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
				if (!res.ok || !out.ok) throw new Error(out.error || 'send failed');

				say(w, 'You are on the list. Talk soon.');
				form.reset();
				form.dispatchEvent(new CustomEvent('newsletter:done', { bubbles: true }));
				const { showSent } = await import('./sent');
				showSent({
					title: 'You are on the list.',
					body: 'One short note when something ships. No noise, no selling, and one click to leave whenever you like.',
					echo: address,
					cta: { label: 'Read the journal', href: '/blog' },
				});
			} catch (err) {
				console.error('[newsletter]', err);
				say(w, (err as Error).message || 'That did not send. Try contact@swizel.co directly.', true);
			} finally {
				if (w.btn) {
					w.btn.disabled = false;
					if (label) w.btn.textContent = label;
				}
			}
		});
	});
}
