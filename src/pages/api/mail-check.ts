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
import net from 'node:net';

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
		// A certificate is issued to a name, never to an address. Connecting
		// by IP means TLS has nothing to verify against, so it either fails
		// outright or succeeds only because verification was skipped —
		// which is an unencrypted-in-practice connection carrying a
		// password. Use the hostname.
		hostIsAnAddress: /^\d+\.\d+\.\d+\.\d+$/.test(cfg.host)
			? 'YES — set SMTP_HOST to the mail hostname (mail.swizel.co) instead. A TLS certificate cannot be checked against a bare IP.'
			: 'no',
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

	// ── 2b. which SMTP ports will this host even talk to us on ──
	//
	// ETIMEDOUT on the configured port tells you the connection never
	// opened; it does not tell you whether the server is down, the port
	// is filtered, or the whole address is unreachable. Opening a bare
	// TCP socket to each of the three answers that in one page load,
	// which is otherwise three rounds of change-a-variable-and-redeploy.
	//
	// 465 is implicit TLS, 587 is STARTTLS, 25 is server-to-server and is
	// blocked by nearly every cloud provider by design.
	const probe = (port: number) =>
		new Promise<string>((resolve) => {
			const t = Date.now();
			const s = net.connect({ host: cfg.host, port });
			const end = (verdict: string) => {
				try {
					s.destroy();
				} catch {
					/* nothing to do */
				}
				resolve(`${verdict} (${Date.now() - t}ms)`);
			};
			s.setTimeout(5000);
			s.once('connect', () => end('open'));
			s.once('timeout', () => end('no answer — filtered or firewalled'));
			s.once('error', (err: NodeJS.ErrnoException) => end(`${err.code ?? 'error'}`));
		});

	const [p465, p587, p25] = await Promise.all([probe(465), probe(587), probe(25)]);
	steps.ports = {
		465: p465,
		587: p587,
		25: p25,
		reading:
			p465.startsWith('open') || p587.startsWith('open')
				? 'At least one submission port is open. Use the one that says open, with SMTP_SECURE=true for 465 and false for 587.'
				: 'Neither 465 nor 587 answered. The mail host is refusing connections from this datacentre, which no change on our side can fix — it needs the host to allow them, or a mail provider that sends over HTTPS instead of SMTP.',
	};

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
