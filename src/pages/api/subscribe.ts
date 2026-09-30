// Joining the list, from any of the six sign-up boxes on the site.
import type { APIRoute } from 'astro';
import { readConfig, transport, release, describeMailError, oneLine, env } from '../../server/mail';
import { subscribeReply, teamNotice, unsubscribeLink, FROM_NAME } from '../../server/emails';
import { checkEmail } from '../../scripts/validate';

export const prerender = false;

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

	if ((data.botField || '').trim()) return json({ ok: true });

	const email = (data.email || '').trim();
	const bad = checkEmail(email);
	if (bad) return json({ ok: false, error: bad }, 400);

	const cfg = readConfig(env());
	if (typeof cfg === 'string') {
		console.error('[subscribe]', cfg);
		return json({ ok: false, error: 'Our mail is being set up. Please write to contact@swizel.co.' }, 503);
	}

	const mailer = transport(cfg);
	const where = oneLine(data.source || 'site');

	try {
		const notice = teamNotice('Newsletter sign-up', [
			['Email', email],
			['From', where],
			['Page', oneLine(data.page || '')],
		]);
		const reply = subscribeReply(email);

		// both at once, over one pooled connection — see the note in
		// api/contact.ts for why sequential sends fail in production
		const [toUs, toThem] = await Promise.allSettled([
			mailer.sendMail({
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: cfg.toContact,
				replyTo: email,
				subject: `[Newsletter] ${where}`,
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
				// The header Gmail and Apple Mail read to draw their own
				// "unsubscribe" button next to the sender's name.
				//
				// List-Unsubscribe-Post used to be here too, and it was
				// wrong: RFC 8058 one-click requires an https target the
				// client can POST to, and ours is a mailto. A mailto with
				// One-Click on it is a header a strict receiver is entitled
				// to distrust, which is the opposite of what it is for.
				// The mailto alone is valid and Gmail honours it.
				//
				// Worth upgrading to a real /api/unsubscribe endpoint later:
				// it would be one click instead of an email, and it would
				// let the One-Click header come back legitimately.
				headers: {
					'List-Unsubscribe': `<${unsubscribeLink(email)}>`,
				},
			}),
		]);

		if (toUs.status === 'rejected') throw toUs.reason;
		if (toThem.status === 'rejected') console.error('[subscribe] confirmation failed', toThem.reason);

		return json({ ok: true });
	} catch (err) {
		// "send failed [object Object]" is not a diagnosis. The code and
		// the one likely cause go in the log, and the code goes in the
		// response too — it names no secret, and it means the fault can be
		// read off a browser's network tab without going to find the log.
		const { code, cause } = describeMailError(err);
		console.error(`[subscribe] send failed — ${code}: ${cause}`, err);
		return json(
			{ ok: false, error: 'That did not send. Try contact@swizel.co directly.', code },
			502
		);
	} finally {
		// The pool belongs to this request. See the note in server/mail.ts:
		// a connection kept across a frozen Vercel container is a dead
		// socket waiting for the next visitor.
		release(mailer);
	}
};
