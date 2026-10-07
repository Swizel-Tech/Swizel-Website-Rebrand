/**
 * A speed bump on the public form endpoints.
 *
 * WHAT THIS IS FOR
 *
 * Every form on this site emails somebody. The newsletter box emails
 * whatever address is typed into it, which means an outsider can make our
 * server send mail to a person who never asked for it. That is the shape
 * of an "email bomb": subscribe one victim to a thousand newsletters at
 * once so the message that matters — a fraud alert, usually — is buried.
 * We are one of the thousand unless we make it tedious.
 *
 * It also stops the ordinary nuisance: the bots that crawl the web
 * looking for forms, submit them, and watch for a reply to confirm the
 * address works. They are the ones arriving as
 * c.a.rloscu.de.r.i2.7@gmail.com — Gmail ignores dots, so every one of
 * those lands in the same real inbox. No human types eight dots into
 * their own address.
 *
 * WHAT THIS IS NOT
 *
 * It is not a wall, and it should not be described as one.
 *
 * The counters live in this process's memory. On Vercel each function
 * runs in a container that may be frozen between requests, replaced at
 * any time, or duplicated under load — so there is no single shared
 * count. A burst from one source into one warm container is caught,
 * which is exactly how these bots behave. A patient attacker spreading
 * requests across minutes and addresses is not.
 *
 * That is a deliberate trade: this costs nothing, needs no new service
 * and no credentials, and removes the cheap attacks. The real fix, if
 * the forms ever come under proper attack, is double opt-in — no mail
 * leaves until somebody clicks a link in it — which also makes the
 * mailing list lawful to hold. That is a bigger job for a quieter day.
 */

type Hit = number[];

/** One bucket per concern, so a flood of sign-ups cannot evict contact's state. */
const buckets = new Map<string, Map<string, Hit>>();

/**
 * Memory is not free and nothing here is ever deliberately deleted, so
 * the map is capped. When it fills, the least recently touched half goes.
 * A rate limiter that runs the container out of memory has caused a worse
 * outage than the one it was preventing.
 */
const MAX_KEYS = 5_000;

function bucket(name: string) {
	let b = buckets.get(name);
	if (!b) {
		b = new Map();
		buckets.set(name, b);
	}
	return b;
}

function prune(b: Map<string, Hit>, now: number, windowMs: number) {
	if (b.size <= MAX_KEYS) return;
	// drop anything whose newest hit has already aged out, then, if that
	// was not enough, the oldest half by last-seen
	for (const [k, hits] of b) {
		const last = hits[hits.length - 1] ?? 0;
		if (now - last > windowMs) b.delete(k);
	}
	if (b.size <= MAX_KEYS) return;
	const byAge = [...b.entries()].sort(
		(x, y) => (x[1][x[1].length - 1] ?? 0) - (y[1][y[1].length - 1] ?? 0)
	);
	for (let i = 0; i < Math.floor(byAge.length / 2); i++) b.delete(byAge[i]![0]);
}

/**
 * Record an attempt and say whether it is within the limit.
 *
 * A sliding window rather than a fixed one: fixed windows let twice the
 * limit through across a boundary, which for a limit this small is the
 * difference between stopping a bot and not.
 *
 * Returns true when the caller should proceed.
 */
export function allow(
	name: string,
	key: string,
	limit: number,
	windowMs: number
): boolean {
	if (!key) return true; // nothing to key on; do not punish the unknown
	const now = Date.now();
	const b = bucket(name);
	prune(b, now, windowMs);

	const hits = (b.get(key) ?? []).filter((t) => now - t < windowMs);
	if (hits.length >= limit) {
		b.set(key, hits); // remember the refusal without extending the window
		return false;
	}
	hits.push(now);
	b.set(key, hits);
	return true;
}

/**
 * Who is asking.
 *
 * Vercel puts the real client at the front of x-forwarded-for; everything
 * after it is the proxy chain and is not ours to trust. x-real-ip is the
 * fallback for other hosts. An empty string means we could not tell, and
 * allow() treats that as "let it through" — refusing everybody we cannot
 * identify would break the form for anyone behind an odd proxy, which is
 * a worse failure than letting a bot past.
 */
export function clientKey(request: Request): string {
	const h = request.headers;
	const fwd = h.get('x-forwarded-for') ?? '';
	const first = fwd.split(',')[0]?.trim();
	return first || h.get('x-real-ip')?.trim() || '';
}

/** Addresses are compared case-insensitively, and Gmail's dots ignored. */
export function emailKey(address: string): string {
	const a = address.trim().toLowerCase();
	const at = a.lastIndexOf('@');
	if (at < 1) return a;
	let local = a.slice(0, at);
	const domain = a.slice(at + 1);
	// c.a.rloscu.de.r.i2.7@gmail.com and carloscuderi27@gmail.com are one
	// inbox, and the dots are the whole trick. Collapse them so a bot
	// cannot buy itself a fresh quota by moving a full stop.
	if (domain === 'gmail.com' || domain === 'googlemail.com') {
		local = local.split('+')[0]!.replace(/\./g, '');
	}
	return `${local}@${domain}`;
}
