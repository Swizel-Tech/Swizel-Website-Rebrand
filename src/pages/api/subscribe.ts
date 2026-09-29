// Joining the list, from any of the six sign-up boxes on the site.
import type { APIRoute } from 'astro';
import { readConfig, transport, oneLine, env } from '../../server/mail';
import { subscribeReply, teamNotice , FROM_NAME } from '../../server/emails';
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
		await mailer.sendMail({
			from: `"${FROM_NAME}" <${cfg.user}>`,
			to: cfg.toContact,
			replyTo: email,
			subject: `[Newsletter] ${where}`,
			text: notice.text,
			html: notice.html,
		});

		const reply = subscribeReply(email);
		const { unsubscribeLink } = await import('../../server/emails');
		await mailer.sendMail({
			from: `"${FROM_NAME}" <${cfg.user}>`,
			to: email,
			replyTo: cfg.toContact,
			subject: reply.subject,
			text: reply.text,
			html: reply.html,
			// the header Gmail and Apple Mail read to draw their own
			// "unsubscribe" button next to the sender's name
			headers: {
				'List-Unsubscribe': `<${unsubscribeLink(email)}>`,
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
			},
		});

		return json({ ok: true });
	} catch (err) {
		console.error('[subscribe] send failed', err);
		return json({ ok: false, error: 'That did not send. Try contact@swizel.co directly.' }, 502);
	}
};
