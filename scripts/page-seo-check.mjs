#!/usr/bin/env node
/**
 * Reads every page the build produced and says what would hurt it in
 * search.
 *
 * scripts/seo-check.mjs already does this for blog posts, from their
 * frontmatter, before the build. This does it for the other thirty-odd
 * pages, from the HTML, after it — which is the only way to catch the
 * things that are not in any one file: a title that a component quietly
 * appended a suffix to, two pages that ended up with the same blue link
 * because the same constant was reused, a canonical pointing at the
 * wrong URL, an internal link to a path that no longer exists.
 *
 * Run it yourself with `npm run seo:pages`. It also runs on every build.
 *
 * Errors fail the build. Warnings do not — they are things worth
 * fixing, not reasons to stop a deploy at midnight.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// The adapter moves the static pages to .vercel/output/static, so look
// there first and fall back to dist for a plain `astro build`.
const ROOTS = ['.vercel/output/static', 'dist'];
const ROOT = ROOTS.find((r) => existsSync(r));

const LIMITS = {
	titleMin: 20,
	titleMax: 62, // Google cuts the blue link around 60; 62 allows a hair
	descMin: 70,
	descMax: 160, // and the grey snippet around here
};

const red = (s) => `\u001b[31m${s}\u001b[0m`;
const yellow = (s) => `\u001b[33m${s}\u001b[0m`;
const green = (s) => `\u001b[32m${s}\u001b[0m`;
const dim = (s) => `\u001b[2m${s}\u001b[0m`;

if (!ROOT) {
	console.log(dim('\nNo build output found — nothing to check. Run the build first.\n'));
	process.exit(0);
}

/** Every .html file under the build output. */
function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, out);
		else if (name.endsWith('.html')) out.push(p);
	}
	return out;
}

const files = walk(ROOT).sort();

/** /a/b/index.html → /a/b/ ; /404.html → /404 */
const urlOf = (file) => {
	const rel = relative(ROOT, file).split(sep).join('/');
	if (rel === 'index.html') return '/';
	if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
	return `/${rel.replace(/\.html$/, '')}`;
};

const one = (html, re) => {
	const m = html.match(re);
	return m ? m[1].trim() : '';
};

/** Decode just enough entities to measure and compare a title honestly. */
const unent = (s) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#8217;/g, '’')
		.replace(/&nbsp;/g, ' ');

const pages = files.map((file) => {
	const html = readFileSync(file, 'utf8');
	const url = urlOf(file);
	return {
		file,
		url,
		html,
		title: unent(one(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
		description: unent(
			one(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)
		),
		canonical: one(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i),
		ogTitle: one(html, /<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']/i),
		ogDesc: one(html, /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i),
		ogImage: one(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i),
		lang: one(html, /<html[^>]*\blang=["']([^"']*)["']/i),
		robots: one(html, /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i),
		h1s: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
			unent(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
		),
		jsonld: [...html.matchAll(
			/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
		)].map((m) => m[1]),
	};
});

/** Every URL this build actually serves, for the internal-link check. */
const served = new Set(pages.map((p) => p.url));
for (const p of pages) {
	// /about/ is served, and /about should be treated as reachable too
	served.add(p.url.replace(/\/$/, '') || '/');
}
const assetExists = (path) => existsSync(join(ROOT, path.replace(/^\//, '')));

let errors = 0;
let warns = 0;
const problem = (msg) => {
	errors++;
	console.log(`  ${red('needs fixing')}  ${msg}`);
};
const note = (msg) => {
	warns++;
	console.log(`  ${yellow('worth a look')}  ${msg}`);
};

const seenTitle = new Map();
const seenDesc = new Map();

console.log(`\nPage SEO check — ${pages.length} pages in ${ROOT}\n`);

for (const p of pages) {
	// ── redirect stubs are not pages ──
	//
	// /bootcamp and /bootcamp/register are retired routes kept alive so
	// old links and old search results land on /programs. In a static
	// build Astro.redirect emits a tiny meta-refresh document with no
	// title, no H1 and a noindex — which is exactly right for a
	// redirect and exactly wrong by every rule below. They are counted
	// and skipped, not judged.
	if (/<meta[^>]+http-equiv=["']refresh["']/i.test(p.html)) {
		console.log(`${dim('·')} ${p.url} ${dim('(redirect — skipped)')}`);
		console.log('');
		continue;
	}

	console.log(`${dim('·')} ${p.url}`);
	const before = errors + warns;
	const is404 = p.url === '/404' || p.url === '/404/';

	// ── the blue link ──
	if (!p.title) problem('no <title> at all.');
	else {
		if (p.title.length > LIMITS.titleMax)
			problem(`title is ${p.title.length} characters — Google cuts it near 60. "${p.title}"`);
		if (p.title.length < LIMITS.titleMin)
			note(`title is only ${p.title.length} characters — there is room to say more.`);
		const key = p.title.toLowerCase();
		const dup = seenTitle.get(key);
		if (dup) problem(`same title as ${dup}. Two pages competing for one phrase beat each other.`);
		else seenTitle.set(key, p.url);
	}

	// ── the grey snippet ──
	if (!p.description) problem('no meta description, so Google will invent one.');
	else {
		if (p.description.length > LIMITS.descMax)
			problem(`description is ${p.description.length} characters; the snippet is cut near 160.`);
		if (p.description.length < LIMITS.descMin)
			note(`description is only ${p.description.length} characters — thin for a snippet.`);
		const key = p.description.toLowerCase();
		const dup = seenDesc.get(key);
		if (dup) note(`same description as ${dup}.`);
		else seenDesc.set(key, p.url);
	}

	// ── the canonical ──
	if (!p.canonical) problem('no canonical link.');
	else {
		let canonPath = '';
		try {
			canonPath = new URL(p.canonical).pathname;
		} catch {
			problem(`canonical is not an absolute URL: ${p.canonical}`);
		}
		if (canonPath) {
			const a = canonPath.replace(/\/$/, '') || '/';
			const b = p.url.replace(/\/$/, '') || '/';
			// Pointing away is sometimes the right answer: a blog post first
			// published elsewhere, or a superseded write-up handing its
			// credit to the newer case study. So it is only a problem when
			// the target is not a page this build actually serves — which is
			// the case that silently de-indexes a page for nothing.
			if (a !== b) {
				const reachable = served.has(a) || served.has(`${a}/`);
				if (!reachable && !p.url.startsWith('/blog/'))
					problem(
						`canonical points at ${canonPath}, which this build does not serve. The page is at ${p.url}.`
					);
			}
		}
	}

	// ── the heading ──
	//
	// Every page on this site renders once per world — boardroom,
	// founder, builder, studio, campus — and each telling carries its own
	// H1, with four of the five hidden by CSS. That is a deliberate part
	// of how the site works, so several H1s is expected here and is only
	// worth a note. Zero is a real problem.
	if (!p.h1s.length) {
		if (!is404) problem('no H1 anywhere on the page.');
	} else if (p.h1s.length > 6) {
		note(`${p.h1s.length} H1s — more than one per world, which is more than intended.`);
	}

	// ── the share card ──
	if (!p.ogTitle) note('no og:title, so a shared link has no headline.');
	if (!p.ogDesc) note('no og:description.');
	if (!p.ogImage) problem('no og:image, so a shared link shows a blank card.');
	else if (!/^https?:\/\//.test(p.ogImage))
		problem(`og:image is relative (${p.ogImage}); WhatsApp and X need an absolute URL.`);

	if (!p.lang) problem('<html> has no lang attribute.');

	if (/noindex/i.test(p.robots) && !is404)
		problem(`robots says "${p.robots}" — this page is telling Google to ignore it.`);

	// ── the structured data ──
	if (!p.jsonld.length) note('no JSON-LD on the page.');
	p.jsonld.forEach((raw, i) => {
		try {
			JSON.parse(raw);
		} catch (e) {
			problem(`JSON-LD block ${i + 1} does not parse: ${e.message}`);
		}
	});

	// ── links that go nowhere ──
	//
	// This is the check that earns its keep. A relative href in the
	// markup is only as good as the route behind it, and a route can be
	// renamed in one file while eight components still point at the old
	// one. Nothing else notices until somebody clicks it.
	const hrefs = new Set(
		[...p.html.matchAll(/href=["'](\/[^"'#?]*)/g)].map((m) => m[1])
	);
	const broken = [];
	for (const href of hrefs) {
		const clean = href.replace(/\/$/, '') || '/';
		if (served.has(href) || served.has(clean) || served.has(`${clean}/`)) continue;
		// An asset rather than a page. The extension window has to be
		// generous: .webmanifest is eleven characters, and a five-character
		// limit read /manifest.webmanifest as a missing page on all
		// thirty-five pages at once.
		if (/\.[a-z0-9]{2,12}$/i.test(href)) {
			if (!assetExists(href)) broken.push(href);
			continue;
		}
		// API routes are functions, not files in the output
		if (href.startsWith('/api/')) continue;
		broken.push(href);
	}
	if (broken.length) {
		const shown = broken.slice(0, 6).join(', ');
		problem(
			`${broken.length} link${broken.length === 1 ? '' : 's'} to nothing: ${shown}${
				broken.length > 6 ? ', …' : ''
			}`
		);
	}

	// ── pictures nobody can describe ──
	// alt="" is not a missing alt — it is the correct way to mark a
	// picture as decorative, and Astro renders it as a bare `alt`
	// attribute with no value. A check for `alt=` therefore reported all
	// twenty duplicated tiles on the home page's belt, which are
	// aria-hidden clones and are supposed to have an empty alt. Only an
	// <img> with no alt attribute at all is a real problem.
	// …and an <img> inside an HTML comment is not on the page at all.
	// One of the legacy write-ups has a commented-out grid image, which
	// this reported as a missing alt on a picture no browser draws.
	const visible = p.html.replace(/<!--[\s\S]*?-->/g, '');
	const imgs = [...visible.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
	const noAlt = imgs.filter((t) => !/\balt(=|[\s/>])/i.test(t)).length;
	if (noAlt) note(`${noAlt} of ${imgs.length} <img> tags have no alt attribute.`);

	if (errors + warns === before) console.log(`  ${green('all good')}`);
	console.log('');
}

// ── the pages that must exist ──
//
// A route can be deleted or renamed and every link to it fixed, and the
// page simply stops being in search results with nobody the wiser. These
// are the ones the plan in src/data/seo.ts depends on.
const REQUIRED = [
	'/',
	'/services',
	'/services/custom-software',
	'/services/app-development',
	'/services/erp-systems',
	'/nigeria',
	'/global',
	'/about',
	'/contact',
	'/portfolio',
	'/blog',
];
const missing = REQUIRED.filter(
	(r) => !served.has(r) && !served.has(`${r}/`)
);
if (missing.length) {
	console.log(`${dim('·')} required pages`);
	problem(`these pages are in the SEO plan but not in the build: ${missing.join(', ')}`);
	console.log('');
}

// ── the sitemap ──
const sitemapIndex = join(ROOT, 'sitemap-index.xml');
if (!existsSync(sitemapIndex)) {
	console.log(`${dim('·')} sitemap`);
	problem('no sitemap-index.xml in the output.');
	console.log('');
}

console.log(
	`${errors ? red(`${errors} to fix`) : green('0 to fix')}  ·  ${
		warns ? yellow(`${warns} worth a look`) : green('0 warnings')
	}\n`
);

if (errors) {
	console.log(red('Page SEO check failed. Fix the errors above.\n'));
	process.exit(1);
}
