// A stethoscope for the mail setup.
//
// When a form fails in production the only evidence is a line in a
// Vercel log that somebody has to go and find, and by then the question
// — is it the key, the password, the port, the firewall, the DNS? — has
// four plausible answers and no way to choose between them.
//
// So: open https://swizel.co/api/mail-check in a browser and it says.
// It runs whichever chain this deployment actually uses and reports
// exactly where it got to and how long each step took.
//
// It is safe to leave live. It returns no key, no password, no full
// mailbox address and no message content — only whether each variable is
// set, hostnames and ports (which are published in DNS anyway), and the
// server's own answer. Everything sensitive is masked before it leaves.
import type { APIRoute } from 'astro';
import { readConfig, transport, release, describeMailError, env } from '../../server/mail';
import { apiBase } from '../../server/send';
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
		RESEND_API_KEY: Boolean(e.RESEND_API_KEY?.trim()),
		MAIL_FROM: e.MAIL_FROM?.trim() ? 'set' : '(not set — falls back to SMTP_USER)',
		MAIL_TO_CONTACT: Boolean(e.MAIL_TO_CONTACT?.trim()),
		MAIL_TO_CAREERS: Boolean(e.MAIL_TO_CAREERS?.trim()),
		PUBLIC_SITE_URL: e.PUBLIC_SITE_URL ?? '(not set — links in emails will guess)',
		SMTP_HOST: Boolean(e.SMTP_HOST?.trim()),
		SMTP_PORT: e.SMTP_PORT ?? '(not set — defaulting to 465)',
		SMTP_SECURE: e.SMTP_SECURE ?? '(not set — derived from the port)',
		SMTP_USER: Boolean(e.SMTP_USER?.trim()),
		SMTP_PASS: Boolean(e.SMTP_PASS),
	};

	const cfg = readConfig(e);
	if (typeof cfg === 'string') {
		return json({ ok: false, stoppedAt: 'configuration', reason: cfg, ...steps });
	}

	steps.courier =
		cfg.courier === 'resend'
			? 'resend — an ordinary HTTPS request to api.resend.com. No SMTP port is opened, so no firewall can block it.'
			: 'smtp — a direct connection to the mail host.';
	steps.addresses = {
		sendsAs: mask(cfg.user),
		enquiriesTo: mask(cfg.toContact),
		applicationsTo: mask(cfg.toCareers),
	};

	// ══ the Resend path ══════════════════════════════════════════════
	if (cfg.courier === 'resend') {
		const t = Date.now();
		try {
			// Listing domains proves three things at once: the key is real,
			// it has not been revoked, and the domain we send as has been
			// verified. An unverified domain is the single reason a first
			// Resend setup fails, and it fails with a validation error that
			// does not obviously say so.
			const res = await fetch(`${apiBase(e)}/domains`, {
				headers: { authorization: `Bearer ${e.RESEND_API_KEY!.trim()}` },
				signal: AbortSignal.timeout(8_000),
			});
			const payload = (await res.json().catch(() => ({}))) as {
				data?: { name: string; status: string; region?: string }[];
				name?: string;
				message?: string;
			};

			// ── a sending-only key cannot list domains, and should not ──
			//
			// The advice is to create the key with "Sending access" rather
			// than full access, because a key that lives in an environment
			// variable is the most exposed thing in the setup and sending
			// is all the site ever needs. Then this check asked to list
			// domains, which that key is quite rightly refused — and
			// reported a failure on a configuration that is not merely
			// working but is working *more* safely than the alternative.
			//
			// So the refusal is read for what it is: proof that the key is
			// real, unrevoked, and correctly scoped. The domain's status
			// simply cannot be read from here, which is said plainly rather
			// than guessed at.
			if (res.status === 401 && payload.name === 'restricted_api_key') {
				steps.resend = {
					keyAccepted: true,
					scope: 'sending only — the safe setting, and the one we recommend',
					ms: Date.now() - t,
					domainStatus:
						'Cannot be read with a sending-only key. Check it in the Resend dashboard under Domains; it must say Verified before mail will go out.',
				};
				return json({
					ok: true,
					summary:
						'The key is valid and correctly restricted to sending. Everything this check can see is right — confirm the domain says Verified in Resend, then submit a form to prove it end to end.',
					totalMs: Date.now() - started,
					...steps,
				});
			}

			if (!res.ok) {
				const { code, cause } = describeMailError({
					code: payload.name,
					message: payload.message,
				});
				return json({
					ok: false,
					stoppedAt: 'resend',
					code,
					cause,
					ms: Date.now() - t,
					...steps,
				});
			}

			const sendingDomain = cfg.user.split('@')[1] ?? '';
			const domains = (payload.data ?? []).map((d) => ({ name: d.name, status: d.status }));
			const ours = domains.find((d) => d.name === sendingDomain);

			steps.resend = {
				keyAccepted: true,
				ms: Date.now() - t,
				domains,
				sendingDomain,
				verdict: !ours
					? `NOT SET UP — ${sendingDomain} is not in this Resend account. Add it under Domains and publish the DNS records it gives you, or mail will be refused.`
					: ours.status === 'verified'
						? 'verified — Resend will send as this domain.'
						: `${ours.status} — the DNS records are not all in place yet. Resend will refuse to send until this says verified.`,
			};

			const good = ours?.status === 'verified';
			return json({
				ok: good,
				summary: good
					? 'Resend holds a valid key and the sending domain is verified. Mail will go out.'
					: 'The key works, but the sending domain is not verified yet — see verdict.',
				totalMs: Date.now() - started,
				...steps,
			});
		} catch (err) {
			const { code, cause } = describeMailError(err);
			return json({
				ok: false,
				stoppedAt: 'resend',
				code,
				cause,
				ms: Date.now() - t,
				...steps,
			});
		}
	}

	// ══ the SMTP path ════════════════════════════════════════════════
	steps.configuration = {
		host: cfg.host,
		port: cfg.port,
		secure: cfg.secure,
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
			? 'YES — set SMTP_HOST to the mail hostname instead. A TLS certificate cannot be checked against a bare IP.'
			: 'no',
	};

	// ── does the hostname resolve from inside the function ──
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

	// ── which SMTP ports will this host even talk to us on ──
	//
	// ETIMEDOUT on the configured port tells you the connection never
	// opened; it does not tell you whether the server is down, the port
	// is filtered, or the whole address is unreachable. Opening a bare
	// TCP socket to each of the three answers that in one page load,
	// which is otherwise three rounds of change-a-variable-and-redeploy.
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
				: 'Neither 465 nor 587 answered. The mail host is refusing connections from this datacentre, which no change on our side can fix — set RESEND_API_KEY and MAIL_FROM to send over HTTPS instead.',
	};

	// ── connect, TLS, and authenticate ──
	const t1 = Date.now();
	const mailer = transport(cfg);
	try {
		await mailer.verify();
		steps.connection = { result: 'connected and authenticated', ms: Date.now() - t1 };
	} catch (err) {
		const { code, cause } = describeMailError(err);
		return json({
			ok: false,
			stoppedAt: 'connection',
			code,
			cause,
			ms: Date.now() - t1,
			totalMs: Date.now() - started,
			...steps,
		});
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
