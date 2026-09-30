// A stethoscope for the mail setup.
//
// When a form fails in production the only evidence is a line in a
// Vercel log that somebody has to go and find, and by then the question
// — is it the password, the port, the firewall, the DNS? — has four
// plausible answers and no way to choose between them.
//
// So: open https://swizel.co/api/mail-check in a browser and it says.
// It resolves SMTP_HOST from inside the function, opens the connection,
// authenticates, and reports exactly where it got to and how long each
// step took.
//
// It is safe to leave live. It returns no password, no full mailbox
// address and no message content — only whether each variable is set,
// the hostname and port (which are published in DNS anyway), and the
// server's own answer. Everything sensitive is masked before it leaves.
import type { APIRoute } from 'astro';
import { readConfig, transport, release, describeMailError, env } from '../../server/mail';
import { promises as dns } from 'node:dns';

export const prerender = false;

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body, null, 2), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});

/** contact@swizel.co → c*****t@swizel.co */
const mask = (address: string) => {
	const [name, domain] = address.split('@');
	if (!domain) return '***';
	const head = name.slice(0, 1);
	const tail = name.length > 1 ? name.slice(-1) : '';
	return `${head}${'*'.repeat(Math.max(1, name.length - 2))}${tail}@${domain}`;
};

export const GET: APIRoute = async () => {
	const started = Date.now();
	const e = env();
	const steps: Record<string, unknown> = {};

	// ── 1. is anything set at all ──
	steps.variables = {
		SMTP_HOST: Boolean(e.SMTP_HOST?.trim()),
		SMTP_PORT: e.SMTP_PORT ?? '(not set — defaulting to 465)',
		SMTP_SECURE: e.SMTP_SECURE ?? '(not set — derived from the port)',
		SMTP_USER: Boolean(e.SMTP_USER?.trim()),
		SMTP_PASS: Boolean(e.SMTP_PASS),
		MAIL_TO_CONTACT: Boolean(e.MAIL_TO_CONTACT?.trim()),
		MAIL_TO_CAREERS: Boolean(e.MAIL_TO_CAREERS?.trim()),
		PUBLIC_SITE_URL: e.PUBLIC_SITE_URL ?? '(not set)',
	};

	const cfg = readConfig(e);
	if (typeof cfg === 'string') {
		return json({ ok: false, stoppedAt: 'configuration', reason: cfg, ...steps }, 200);
	}

	steps.configuration = {
		host: cfg.host,
		port: cfg.port,
		secure: cfg.secure,
		user: mask(cfg.user),
		sendsTo: { contact: mask(cfg.toContact), careers: mask(cfg.toCareers) },
		// The commonest misconfiguration there is, stated rather than implied.
		portAndSecurityAgree:
			(cfg.port === 465 && cfg.secure) || (cfg.port !== 465 && !cfg.secure)
				? 'yes'
				: 'NO — 465 must be secure, 587 must not be. Fix SMTP_PORT or SMTP_SECURE.',
	};

	// ── 2. does the hostname resolve from inside the function ──
	//
	// Noted, never fatal. dns.resolve4 asks a nameserver directly, which
	// is not how the connection itself resolves the host — that goes
	// through the platform resolver, and can succeed on IPv6, a hosts
	// file or a cache when a direct query fails. Treating a failure here
	// as the answer reports a DNS fault on a mailbox that connects
	// perfectly well, so the check records what it found and carries on
	// to the step that actually decides.
	const t0 = Date.now();
	if (/^\d+\.\d+\.\d+\.\d+$/.test(cfg.host) || cfg.host.includes(':')) {
		steps.dns = { skipped: 'SMTP_HOST is already an address, so there is nothing to look up.' };
	} else {
		try {
			steps.dns = { addresses: await dns.resolve4(cfg.host), ms: Date.now() - t0 };
		} catch (err) {
			steps.dns = {
				lookupFailed: (err as { code?: string }).code ?? 'UNKNOWN',
				ms: Date.now() - t0,
				note: 'Not necessarily the fault — the connection below uses the platform resolver, not this query. If that also fails with ENOTFOUND, then SMTP_HOST is wrong.',
			};
		}
	}

	// ── 3. connect, TLS, and authenticate ──
	const t1 = Date.now();
	const mailer = transport(cfg);
	try {
		await mailer.verify();
		steps.connection = { result: 'connected and authenticated', ms: Date.now() - t1 };
	} catch (err) {
		const { code, cause } = describeMailError(err);
		return json(
			{
				ok: false,
				stoppedAt: 'connection',
				code,
				cause,
				ms: Date.now() - t1,
				totalMs: Date.now() - started,
				...steps,
			},
			200
		);
	} finally {
		release(mailer);
	}

	return json({
		ok: true,
		summary: 'Mail is configured correctly and the server accepted our credentials.',
		totalMs: Date.now() - started,
		...steps,
	});
};
