// A brief from any of the contact forms.
//
// Two mails go out: one to the Swizel inbox with everything in it, and
// one back to the person confirming it arrived. The second is the whole
// point of moving off a third-party sender — it comes from
// contact@swizel.co, so it lands in an inbox rather than a spam folder.
import type { APIRoute } from 'astro';
import { readConfig, describeMailError, oneLine, env } from '../../server/mail';
import { sendAll } from '../../server/send';
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

	// Read the environment once and hand the same snapshot to both, so the
	// courier that sendAll picks is the one readConfig validated for.
	const e = env();
	const cfg = readConfig(e);
	if (typeof cfg === 'string') {
		console.error('[contact]', cfg);
		return json(
			{ ok: false, error: 'Our mail is being set up. Please write to contact@swizel.co.' },
			503
		);
	}

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

		// Both at once. Sent one after the other they were two round trips
		// inside a function that Vercel kills at ten seconds — which fails
		// in production while working perfectly on a laptop.
		//
		// The two are not equally important, and the code says so: if the
		// enquiry to our own inbox fails, the visitor has to be told,
		// because their message really is lost. If only their receipt
		// fails, we have the enquiry and telling them it failed would be
		// a lie that costs us the lead.
		const [toUs, toThem] = await sendAll(cfg, e, [
			{
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: cfg.toContact,
				replyTo: `"${oneLine(name)}" <${email}>`, // hitting reply answers them
				subject: `[Contact] ${oneLine(name)}`,
				text: notice.text,
				html: notice.html,
			},
			{
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: email,
				replyTo: cfg.toContact,
				subject: reply.subject,
				text: reply.text,
				html: reply.html,
			},
		]);

		if (!toUs.ok) throw toUs.error;
		// The id is the only way to find a specific message in Resend's log
		// when somebody says "it never arrived" — without it you are
		// scrolling a list by timestamp and guessing.
		console.log(`[contact] enquiry accepted — resend id ${toUs.id ?? 'none'} → ${cfg.toContact}`);
		if (!toThem.ok) console.error('[contact] confirmation failed', toThem.error);

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
	}
	// no finally: sendAll owns the connection now, and closes its own.
};
