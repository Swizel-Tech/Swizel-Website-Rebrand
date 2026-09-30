// Sending mail from swizel.co's own mailbox.
//
// Every value comes from the environment, so moving to a different host
// is four values in Vercel and a redeploy — no code change, ever. If a
// value is missing the endpoints say so plainly rather than failing in a
// way that looks like the form is broken.
import nodemailer from 'nodemailer';

export interface MailConfig {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	toContact: string;
	toCareers: string;
}

/**
 * Where the values actually come from at runtime.
 *
 * Astro replaces `import.meta.env.SOMETHING` at build time for anything
 * it knows about, which on Vercel means a function can end up holding
 * the value that existed when the site was built — or nothing at all,
 * if the variable was added afterwards. `process.env` is read live by
 * the function on every invocation, which is what we want, so it is
 * asked first and import.meta.env is only the fallback for local dev.
 */
export function env(): Record<string, string | undefined> {
	const fromProcess =
		typeof process !== 'undefined' && process.env ? process.env : {};
	const fromAstro = (import.meta.env ?? {}) as Record<string, string | undefined>;
	return { ...fromAstro, ...fromProcess };
}

/** Read the environment once, and say exactly what is missing if it is. */
export function readConfig(env: Record<string, string | undefined>): MailConfig | string {
	const host = env.SMTP_HOST?.trim();
	const user = env.SMTP_USER?.trim();
	const pass = env.SMTP_PASS;
	const missing = [
		!host && 'SMTP_HOST',
		!user && 'SMTP_USER',
		!pass && 'SMTP_PASS',
	].filter(Boolean);
	if (missing.length) return `Mail is not configured yet: ${missing.join(', ')} missing.`;

	const port = Number(env.SMTP_PORT ?? 465);
	return {
		host: host!,
		port,
		// 465 is implicit TLS; 587 upgrades with STARTTLS. Getting this
		// backwards is the single most common reason a cPanel mailbox
		// refuses a connection, so it is derived from the port rather than
		// left to be typed in wrongly.
		secure: env.SMTP_SECURE ? env.SMTP_SECURE !== 'false' : port === 465,
		user: user!,
		pass: pass!,
		toContact: env.MAIL_TO_CONTACT?.trim() || user!,
		toCareers: env.MAIL_TO_CAREERS?.trim() || env.MAIL_TO_CONTACT?.trim() || user!,
	};
}

/**
 * A transporter for ONE request, then thrown away.
 *
 * This used to be cached in a module-level variable, which looks like an
 * obvious optimisation and is a trap in a serverless function. Vercel
 * keeps a warm container between invocations but FREEZES it — the
 * process stops mid-socket. The pooled TLS connection inside the cached
 * transporter stays in the object graph while the mail server, seeing
 * nothing for a few minutes, quietly closes its end. The next visitor
 * thaws the container, nodemailer hands their message to a socket that
 * is already dead, and the send fails.
 *
 * That is exactly the shape of the fault reported here: it worked, then
 * it stopped, then it sometimes worked again — because a cold container
 * gets a fresh connection and a warm one gets the corpse of the last.
 *
 * So the pool is per-request now. Both messages in a request still share
 * one connection, which is the part that actually mattered for the time
 * budget; the connection is closed when the request ends. The cost is
 * one TLS handshake per form submission, which nobody will ever notice.
 */
export function transport(cfg: MailConfig) {
	return nodemailer.createTransport({
		host: cfg.host,
		port: cfg.port,
		secure: cfg.secure,
		auth: { user: cfg.user, pass: cfg.pass },
		// One connection, reused for both messages in this request.
		// Opening a second TLS session to a shared cPanel host costs
		// seconds we do not have.
		pool: true,
		maxConnections: 1,
		maxMessages: 10,
		// A Vercel function on the Hobby plan is killed at ten seconds, so
		// the whole exchange has to fit inside that with room to answer.
		//
		// These were 4s/4s/6s, which is tight for a shared cPanel host
		// that can take three or four seconds just to finish its TLS
		// handshake under load. 6s/6s/8s still leaves the function time to
		// return a reply rather than being killed mid-send — a kill is
		// what produces a real Vercel 502, with no log line to read.
		connectionTimeout: 6_000,
		greetingTimeout: 6_000,
		socketTimeout: 8_000,
	});
}

/** Close a per-request transporter without letting that become the error. */
export function release(mailer: { close?: () => void } | null | undefined) {
	try {
		mailer?.close?.();
	} catch {
		/* the request is already answered; a failed close is not news */
	}
}

/**
 * Turn a nodemailer failure into something a person can act on.
 *
 * "send failed [object Object]" in a log at two in the morning tells you
 * nothing. Every one of these codes has exactly one likely cause and one
 * obvious next step, so they are spelled out rather than left to be
 * looked up.
 */
export function describeMailError(err: unknown): { code: string; cause: string } {
	const e = (err ?? {}) as { code?: string; responseCode?: number; message?: string };
	const code = e.code || (e.responseCode ? `SMTP${e.responseCode}` : 'UNKNOWN');
	const causes: Record<string, string> = {
		EAUTH:
			'The mailbox rejected the username or password. Check SMTP_USER is the full address and that SMTP_PASS is the mailbox password, not the cPanel login.',
		ENOTFOUND: 'SMTP_HOST does not resolve. Check the hostname and its DNS record.',
		EAI_AGAIN: 'DNS lookup for SMTP_HOST failed temporarily.',
		// nodemailer's own wrapper around a failed getaddrinfo
		EDNS: 'SMTP_HOST could not be resolved. Check the hostname for a typo, and that its DNS record still exists.',
		ECONNREFUSED:
			'The mail server refused the connection on this port. Check SMTP_PORT — 465 for SSL, 587 for STARTTLS.',
		ETIMEDOUT:
			'The mail server did not answer in time. Usually the host firewalling connections from a datacentre, or the wrong port.',
		ESOCKET:
			'The TLS handshake failed. Usually SMTP_SECURE set against the port — 465 must be secure, 587 must not.',
		ECONNECTION: 'Could not open a connection to the mail server.',
		EENVELOPE: 'The server rejected a sender or recipient address.',
		EMESSAGE: 'The server accepted the connection but rejected the message itself.',
		SMTP550:
			'The server rejected the message. On a shared host this is most often the hourly sending limit, or the mailbox being over quota.',
		SMTP535: 'Authentication failed. The mailbox password is wrong or has been changed.',
	};
	return { code, cause: causes[code] || e.message?.slice(0, 200) || 'No detail from the server.' };
}

/** Strip anything that could inject a second header into a subject line. */
export const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);

/** Escape for dropping user input into an HTML email safely. */
export const esc = (v: string) =>
	v
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
