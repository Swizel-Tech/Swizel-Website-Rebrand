// A brief from any of the contact forms.
//
// Two mails go out: one to the Swizel inbox with everything in it, and
// one back to the person confirming it arrived. The second is the whole
// point of moving off a third-party sender — it comes from
// contact@swizel.co, so it lands in an inbox rather than a spam folder.
import type { APIRoute } from 'astro';
import { readConfig, transport, release, describeMailError, oneLine, env } from '../../server/mail';
import { contactReply, teamNotice , FROM_NAME } from '../../server/emails';
import { checkName, checkEmail, checkPhone, checkMessage } from '../../scripts/validate';

export const prerender = false; // this one route is a function; every page stays static

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});

export const POST: APIRoute = async ({ request }) => {
	let data: Record<string, string>;
	try {
		data = await request.json();
	} catch {
		return json({ ok: false, error: 'We could not read that. Please try again.' }, 400);
	}

	// the box no human can see; a machine fills everything it finds
	if ((data.botField || '').trim()) return json({ ok: true });

	const name = (data.name || '').trim();
	const email = (data.email || '').trim();
	const phone = (data.phone || '').trim();
	const message = (data.message || '').trim();

	// The same checks the browser ran, run again here. The ones in the
	// browser are a courtesy to the visitor; these are the ones that count,
	// because anything can post to this URL.
	const bad =
		checkName(name) ||
		checkEmail(email) ||
		checkPhone(phone, false) ||
		checkMessage(message, { minWords: 5, maxChars: 4000 });
	if (bad) return json({ ok: false, error: bad }, 400);

	const cfg = readConfig(env());
	if (typeof cfg === 'string') {
		console.error('[contact]', cfg);
		return json(
			{ ok: false, error: 'Our mail is being set up. Please write to contact@swizel.co.' },
			503
		);
	}

	const mailer = transport(cfg);
	const source = oneLine(data.source || 'Contact form');

	try {
		const notice = teamNotice(
			'New enquiry',
			[
				['Name', name],
				['Email', email],
				['Phone', phone || 'Not given'],
				['From', source],
			],
			message
		);

		const reply = contactReply(name);

		// Both at once, over one pooled connection. Sent one after the
		// other they were two round trips to a shared cPanel host inside a
		// function that Vercel kills at ten seconds — which fails in
		// production while working perfectly on a laptop.
		//
		// allSettled, not all: if the confirmation to the visitor fails,
		// the enquiry is still safely in our inbox and the form should not
		// report a failure for mail we actually received.
		const [toUs, toThem] = await Promise.allSettled([
			mailer.sendMail({
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: cfg.toContact,
				replyTo: `"${oneLine(name)}" <${email}>`, // hitting reply answers them
				subject: `[Contact] ${oneLine(name)}`,
				text: notice.text,
				html: notice.html,
			}),
			mailer.sendMail({
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: email,
				replyTo: cfg.toContact,
				subject: reply.subject,
				text: reply.text,
				html: reply.html,
			}),
		]);

		if (toUs.status === 'rejected') throw toUs.reason;
		if (toThem.status === 'rejected') {
			// worth knowing about, but not worth telling the visitor their
			// message failed when it did not
			console.error('[contact] confirmation failed', toThem.reason);
		}

		return json({ ok: true });
	} catch (err) {
		const { code, cause } = describeMailError(err);
		console.error(`[contact] send failed — ${code}: ${cause}`, err);
		return json(
			{
				ok: false,
				error: 'That did not send. Please try contact@swizel.co, or the live chat.',
				code,
			},
			502
		);
	} finally {
		// per-request pool — see the note in server/mail.ts
		release(mailer);
	}
};
