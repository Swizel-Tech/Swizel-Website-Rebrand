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

let cached: nodemailer.Transporter | null = null;

export function transport(cfg: MailConfig) {
	if (cached) return cached;
	cached = nodemailer.createTransport({
		host: cfg.host,
		port: cfg.port,
		secure: cfg.secure,
		auth: { user: cfg.user, pass: cfg.pass },
		// a shared host can be slow to answer; better to fail in ten
		// seconds with a clear message than to hang the visitor's button
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 20_000,
	});
	return cached;
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
