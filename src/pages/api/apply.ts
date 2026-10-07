// An IT or NYSC placement application. Goes to the careers desk.
import type { APIRoute } from 'astro';
import { readConfig, describeMailError, oneLine, env } from '../../server/mail';
import { sendAll } from '../../server/send';
import { applyReply, teamNotice , FROM_NAME } from '../../server/emails';
import { checkName, checkEmail, checkPhone } from '../../scripts/validate';
import { allow, clientKey, emailKey } from '../../server/rateLimit';

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

	/* ── the speed bump ──────────────────────────────────────────────
	   Same answer as the honeypot above — a cheerful ok, no mail sent.
	   Telling a bot it has been rate limited only teaches it the shape
	   of the limit; a person who double-clicks sees nothing wrong, which
	   is also what we want. The refusal is logged so it is visible in
	   the Vercel logs when somebody asks why applications stopped. */
	{
		const ip = clientKey(request);
		if (!allow('apply:ip', ip, 4, 10 * 60_000)) {
			console.warn(`[apply] rate limited ip ${ip}`);
			return json({ ok: true });
		}
	}

	const name = (data.fullName || '').trim();
	const email = (data.email || '').trim();
	const phone = (data.phone || '').trim();
	const track = (data.track || 'Placement').trim();

	const bad =
		checkName(name, { full: true, label: 'full name' }) ||
		checkEmail(email) ||
		checkPhone(phone, true);
	if (bad) return json({ ok: false, error: bad }, 400);

	/* The address is guarded separately from the IP, because the attack
	   that matters is not volume from one machine — it is the SAME
	   victim's address submitted from many. Two applications from one address an hour is plenty.
	   Gmail's dots are collapsed first, so moving a full stop does not
	   buy a fresh quota. */
	if (!allow('apply:email', emailKey(email), 2, 60 * 60_000)) {
		console.warn(`[apply] rate limited address`);
		return json({ ok: true });
	}

	const e = env();
	const cfg = readConfig(e);
	if (typeof cfg === 'string') {
		console.error('[apply]', cfg);
		return json({ ok: false, error: 'Our mail is being set up. Please write to career@swizel.co.' }, 503);
	}

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

		// both at once — see the note in api/contact.ts
		const [toUs, toThem] = await sendAll(cfg, e, [
			{
				from: `"${FROM_NAME}" <${cfg.user}>`,
				to: cfg.toCareers, // a placement is a careers matter, not a sales one
				replyTo: `"${oneLine(name)}" <${email}>`,
				subject: `[Application] ${oneLine(track)} — ${oneLine(name)}`,
				headers: {
					'Auto-Submitted': 'auto-generated',
					'X-Entity-Ref-ID': `application-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
				},
				text: notice.text,
				html: notice.html,
			},
			{
				from: `"${FROM_NAME} · Careers" <${cfg.user}>`,
				to: email,
				replyTo: cfg.toCareers,
				subject: reply.subject,
				text: reply.text,
				html: reply.html,
			},
		]);

		if (!toUs.ok) throw toUs.error;
		console.log(`[apply] application accepted — resend id ${toUs.id ?? 'none'} → ${cfg.toCareers}`);
		if (!toThem.ok) console.error('[apply] confirmation failed', toThem.error);

		return json({ ok: true });
	} catch (err) {
		const { code, cause } = describeMailError(err);
		console.error(`[apply] send failed — ${code}: ${cause}`, err);
		return json(
			{ ok: false, error: 'That did not send. Please write to career@swizel.co.', code },
			502
		);
	}
	// no finally: sendAll owns the connection now, and closes its own.
};
