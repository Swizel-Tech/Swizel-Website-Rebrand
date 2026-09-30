// The brief form, in the boardroom, builder, studio and founder worlds.
//
// Why this is a module and not a <script> inside ContactForm.astro.
//
// It was in the component, which is the obvious place for it and is
// wrong on this site. A component's script is bundled per page and runs
// once, when that page is first parsed. The site navigates with swup:
// the URL changes and the markup is replaced, but the document is never
// reloaded and no page script runs again. So the form worked if you
// typed /contact into the address bar, and was completely dead if you
// arrived by clicking "Contact" — which is how essentially everyone
// arrives. The submit button did nothing at all.
//
// The newsletter had exactly this bug and was fixed the same way: one
// init function, called from the list in MainLayout that runs on first
// load AND on every swup contentReplaced. That list is the only place on
// this site where a handler can be attached and stay attached.
import { type ContactFormData, contactFormDetails } from '../consts';
import { rules, looksAutomated } from './validate';
import toaster from './toast';

const CHECKS: Record<string, (v: string) => string | null> = {
	name: rules.name,
	email: rules.email,
	phoneNumber: rules.phone,
	message: rules.message,
};

export function initContactForm() {
	// Every world dresses this form differently, so the page can hold more
	// than one copy of it with only one visible at a time. Wire them ALL,
	// and scope every lookup to the form it belongs to — a page-wide
	// querySelector only ever found the first copy and left the rest dead.
	const forms = document.querySelectorAll<HTMLFormElement>('form#contact-form');
	if (!forms.length) return;

	const toast = toaster();

	forms.forEach((form) => {
		// contentReplaced fires on every navigation, and a form that
		// survived one would otherwise collect a second handler and send
		// the brief twice.
		if (form.dataset.contactReady === '1') return;
		form.dataset.contactReady = '1';

		const inputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
		const notes: HTMLParagraphElement[] = [];

		contactFormDetails.forEach(({ name }) => {
			const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${name}`);
			const note = form.querySelector<HTMLParagraphElement>(`#${name}-error`);
			if (input) inputs.push(input);
			if (note) notes.push(note);
		});

		const button = form.querySelector<HTMLElement>('#form-button');

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			notes.forEach((n) => (n.textContent = ''));

			let data: ContactFormData = { email: '', message: '', name: '', phoneNumber: '' };
			inputs.forEach(({ value, name }) => {
				data = { ...data, [name]: value };
			});

			// a machine filled in the box no human can see: drop it without
			// a word, so whatever is doing this learns nothing
			if (looksAutomated(form)) {
				form.reset();
				toast('success', "Thanks for reaching out to us, we'd be in touch shortly");
				return;
			}

			// Every field is checked, and every failing field says why on
			// itself — one "please fill all required fields" in a toast
			// leaves the person to work out which.
			const problems: { field: string; msg: string }[] = [];
			for (const key of Object.keys(CHECKS)) {
				const msg = CHECKS[key]!((data as Record<string, string>)[key] ?? '');
				if (msg) problems.push({ field: key, msg });
			}

			if (problems.length) {
				problems.forEach(({ field, msg }) => {
					const note = notes.find(({ id }) => id === `${field}-error`);
					if (note) note.textContent = msg;
					inputs.find((el) => el.name === field)?.setAttribute('aria-invalid', 'true');
				});
				toast('danger', problems[0]!.msg);
				const first = inputs.find((el) => el.name === problems[0]!.field);
				first?.focus();
				first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
				return;
			}

			inputs.forEach((el) => el.removeAttribute('aria-invalid'));

			const label = button?.textContent ?? 'Submit';
			if (button) {
				button.textContent = 'Sending…';
				button.setAttribute('disabled', 'true');
			}

			try {
				// Our own endpoint. The checks above run again on the server,
				// because anything at all can post to that URL.
				const pot = form.querySelector<HTMLInputElement>('input[name="bot-field"]');
				const res = await fetch('/api/contact', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						name: data.name,
						email: data.email,
						phone: data.phoneNumber,
						message: data.message,
						source: `Contact form · ${window.location.pathname}`,
						botField: pot?.value ?? '',
					}),
				});
				const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
				if (!res.ok || !out.ok) throw new Error(out.error || 'send failed');

				form.reset();
				const { showSent } = await import('./sent');
				showSent({
					title: 'Thanks for reaching out!',
					body: 'A senior member of our team reviews every submission personally. Expect a direct response within one business day, typically the same day.',
					echo: data.email,
					cta: { label: 'See our work', href: '/portfolio' },
				});
			} catch (err) {
				console.error('[contact]', err);
				toast(
					'danger',
					(err as Error)?.message ||
						'That did not send. You can reach us on live chat, or at contact@swizel.co.'
				);
			} finally {
				if (button) {
					button.textContent = label;
					button.removeAttribute('disabled');
				}
			}
		});
	});
}
