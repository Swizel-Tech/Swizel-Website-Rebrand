// An IT or NYSC placement application. Goes to the careers desk.
import type { APIRoute } from 'astro';
import { readConfig, transport, release, describeMailError, oneLine, env } from '../../server/mail';
import { applyReply, teamNotice , FROM_NAME } from '../../server/emails';
import { checkName, checkEmail, checkPhone } from '../../scripts/validate';

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

	const name = (data.fullName || '').trim();
	const email = (data.email || '').trim();
	const phone = (data.phone || '').trim();
	const track = (data.track || 'Placement').trim();

	const bad =
		checkName(name, { full: true, label: 'full name' }) ||
		checkEmail(email) ||
		checkPhone(phone, true);
	if (bad) return json({ ok: false, error: bad }, 400);

	const cfg = readConfig(env());
	if (typeof cfg === 'string') {
		console.error('[apply]', cfg);
		return json({ ok: false, error: 'Our mail is being set up. Please write to career@swizel.co.' }, 503);
	}

	const mailer = transport(cfg);

	// whatever else the form collected, kept in the order it was sent
	const extras: [string, string][] = Object.entries(data)
		.filter(([k]) => !['fullName', 'email', 'phone', 'track', 'botField', 'source'].includes(k))
		.map(([k, v]) => [k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()), String(v ?? '')]);

	try {
		const notice = teamNotice(
			`Application — ${track}`,
			[['Name', name], ['Email', email], ['Phone', phone], ['Track', track], ...extras]
		);
		const reply = applyReply(name, track);

		// both at once, over one pooled connection — see api/contact.ts
		const [toUs, toThem] = await Promise.allSettled([
			mailer.sendMail({
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: cfg.toCareers, // a placement is a careers matter, not a sales one
				replyTo: `"${oneLine(name)}" <${email}>`,
				subject: `[Application] ${oneLine(track)} — ${oneLine(name)}`,
				text: notice.text,
				html: notice.html,
			}),
			mailer.sendMail({
				from: `"${FROM_NAME} · Careers" <${cfg.user}>`,
				to: email,
				replyTo: cfg.toCareers,
				subject: reply.subject,
				text: reply.text,
				html: reply.html,
			}),
		]);

		if (toUs.status === 'rejected') throw toUs.reason;
		if (toThem.status === 'rejected') console.error('[apply] confirmation failed', toThem.reason);

		return json({ ok: true });
	} catch (err) {
		const { code, cause } = describeMailError(err);
		console.error(`[apply] send failed — ${code}: ${cause}`, err);
		return json(
			{ ok: false, error: 'That did not send. Please write to career@swizel.co.', code },
			502
		);
	} finally {
		// per-request pool — see the note in server/mail.ts
		release(mailer);
	}
};
