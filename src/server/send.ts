// How a message actually leaves the building.
//
// It used to leave over SMTP, straight to the domain's own mailbox on
// its cPanel host. That is the tidiest arrangement there is when it
// works, and it stopped working the day the site went live on Vercel:
// ports 25, 465 and 587 all time out from the datacentre. The host is
// refusing connections from a machine it does not recognise, which is a
// firewall between two companies and not something any setting here can
// undo.
//
// So there are two couriers now, and the environment picks:
//
//   RESEND_API_KEY set  → an ordinary HTTPS request to api.resend.com.
//                         No SMTP port is involved at any point, so
//                         there is no firewall to be blocked by.
//   otherwise           → SMTP, exactly as before.
//
// Keeping both is deliberate. SMTP still works from a laptop, so local
// development needs no account and no key; and if the host ever opens
// its ports, removing one variable moves everything back with no code
// change. Neither path knows anything about forms — they take the same
// messages and report the same results, one per message, in order.
import type { MailConfig } from './mail';
import { transport, release } from './mail';

export interface Outgoing {
	/** `Display Name <address@domain>` */
	from: string;
	to: string;
	replyTo?: string;
	subject: string;
	text: string;
	html: string;
	headers?: Record<string, string>;
}

export type SendResult = { ok: true; id?: string } | { ok: false; error: unknown };

/** Which courier this environment will use, without sending anything. */
export function courierName(env: Record<string, string | undefined>): 'resend' | 'smtp' {
	return env.RESEND_API_KEY?.trim() ? 'resend' : 'smtp';
}

/**
 * An error from Resend, shaped so describeMailError can read it the same
 * way it reads a nodemailer failure.
 */
export class SendError extends Error {
	code: string;
	constructor(code: string, message: string) {
		super(message);
		this.name = 'SendError';
		this.code = code;
	}
}

/** Everything the API needs, in its own spelling. */
function resendBody(m: Outgoing) {
	return {
		from: m.from,
		to: [m.to],
		...(m.replyTo ? { reply_to: m.replyTo } : {}),
		subject: m.subject,
		text: m.text,
		html: m.html,
		...(m.headers ? { headers: m.headers } : {}),
	};
}

/**
 * Where the API lives. Overridable only so the whole path can be tested
 * against a throwaway server — sending real mail to prove that sending
 * works is a bad way to find out it does not.
 */
export const apiBase = (env: Record<string, string | undefined>) =>
	env.RESEND_API_BASE?.trim().replace(/\/+$/, '') || 'https://api.resend.com';

async function viaResend(
	key: string,
	base: string,
	messages: Outgoing[]
): Promise<SendResult[]> {
	// One request per message, all in flight together. The batch endpoint
	// would do it in a single call, but it quietly refuses some fields and
	// fails the whole batch when it does — and two parallel requests over
	// one warm TLS connection cost almost nothing, while giving a real
	// per-message result rather than one verdict for both.
	return Promise.all(
		messages.map(async (m): Promise<SendResult> => {
			const stop = AbortSignal.timeout(8_000);
			try {
				const res = await fetch(`${base}/emails`, {
					method: 'POST',
					headers: {
						authorization: `Bearer ${key}`,
						'content-type': 'application/json',
					},
					body: JSON.stringify(resendBody(m)),
					signal: stop,
				});

				const payload = (await res.json().catch(() => ({}))) as {
					id?: string;
					name?: string;
					message?: string;
				};

				if (!res.ok) {
					// Resend names its failures, and the names are useful:
					// validation_error, missing_api_key, invalid_api_key,
					// not_found, daily_quota_exceeded, rate_limit_exceeded.
					return {
						ok: false,
						error: new SendError(
							payload.name || `HTTP_${res.status}`,
							payload.message || `Resend returned ${res.status}.`
						),
					};
				}
				return { ok: true, id: payload.id };
			} catch (err) {
				const aborted = (err as Error)?.name === 'TimeoutError';
				return {
					ok: false,
					error: aborted
						? new SendError('RESEND_TIMEOUT', 'api.resend.com did not answer within eight seconds.')
						: err,
				};
			}
		})
	);
}

async function viaSmtp(cfg: MailConfig, messages: Outgoing[]): Promise<SendResult[]> {
	const mailer = transport(cfg);
	try {
		const settled = await Promise.allSettled(
			messages.map((m) =>
				mailer.sendMail({
					from: m.from,
					to: m.to,
					replyTo: m.replyTo,
					subject: m.subject,
					text: m.text,
					html: m.html,
					headers: m.headers,
				})
			)
		);
		return settled.map((s): SendResult =>
			s.status === 'fulfilled' ? { ok: true } : { ok: false, error: s.reason }
		);
	} finally {
		// The pool belongs to this request — see the note in mail.ts about
		// what a frozen Vercel container does to a connection left open.
		release(mailer);
	}
}

/**
 * Send every message, and answer with one result per message, in the
 * order they were given. Never throws: a caller decides for itself which
 * failures matter, because they do not all matter equally — losing the
 * enquiry to our own inbox is serious, and failing to send the visitor
 * their receipt is not a reason to tell them their message was lost.
 */
export async function sendAll(
	cfg: MailConfig,
	env: Record<string, string | undefined>,
	messages: Outgoing[]
): Promise<SendResult[]> {
	const key = env.RESEND_API_KEY?.trim();
	return key ? viaResend(key, apiBase(env), messages) : viaSmtp(cfg, messages);
}
