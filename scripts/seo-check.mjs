#!/usr/bin/env node
// Reads every blog post and says what would hurt it in search.
//
// The CMS can describe a field and nudge a length, but it cannot count
// words, notice that two posts share a title, or spot a heading that
// jumps from H2 to H4. This does, and it runs on every build — so a post
// cannot go live with no meta description and nobody find out for a
// month.
//
// Errors fail the build. Warnings do not: they are things worth fixing,
// not reasons to stop a deploy at midnight.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIR = 'src/content/blog';
const PUBLIC = 'public';

// What search engines actually do with each field, as of now.
const LIMITS = {
	titleMin: 20,
	titleMax: 60, // Google cuts the blue link around here
	descMin: 70,
	descMax: 160, // and the grey snippet around here
	bodyMinWords: 300, // under this a post reads as thin
	imageMaxKB: 500,
};

const red = (s) => `\u001b[31m${s}\u001b[0m`;
const yellow = (s) => `\u001b[33m${s}\u001b[0m`;
const green = (s) => `\u001b[32m${s}\u001b[0m`;
const dim = (s) => `\u001b[2m${s}\u001b[0m`;

/** Frontmatter without pulling in a YAML parser for four keys. */
function parse(raw) {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!m) return { data: {}, body: raw };
	const data = {};
	let key = null;
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
		if (kv) {
			key = kv[1];
			let v = kv[2].trim();
			if (
				(v.startsWith("'") && v.endsWith("'")) ||
				(v.startsWith('"') && v.endsWith('"'))
			) {
				v = v.slice(1, -1);
			}
			data[key] = v;
		} else if (key && /^\s+/.test(line) && line.trim()) {
			// a folded value continued on the next line
			data[key] = `${data[key]} ${line.trim()}`.trim();
		}
	}
	return { data, body: m[2] };
}

const posts = [];
for (const file of readdirSync(DIR)) {
	if (extname(file) !== '.md' && extname(file) !== '.mdx') continue;
	if (file.startsWith('.')) continue; // the style guide, not a post
	const raw = readFileSync(join(DIR, file), 'utf8');
	posts.push({ file, ...parse(raw) });
}

let errors = 0;
let warns = 0;
const seenTitles = new Map();
const seenDescs = new Map();

const problem = (file, msg) => {
	errors++;
	console.log(`  ${red('needs fixing')}  ${msg}`);
};
const note = (file, msg) => {
	warns++;
	console.log(`  ${yellow('worth a look')}  ${msg}`);
};

console.log(`\nSEO check — ${posts.length} post${posts.length === 1 ? '' : 's'}\n`);

for (const { file, data, body } of posts) {
	const draft = String(data.draft) === 'true';
	console.log(`${dim('·')} ${file}${draft ? dim(' (draft)') : ''}`);
	const before = errors + warns;

	// ── the blue link ──
	const title = (data.seoTitle || data.title || '').trim();
	if (!title) problem(file, 'no title at all.');
	else {
		if (title.length > LIMITS.titleMax)
			note(file, `title is ${title.length} characters; Google cuts it near ${LIMITS.titleMax}. Set an "SEO — title for Google" to keep the page headline as it is.`);
		if (title.length < LIMITS.titleMin)
			note(file, `title is only ${title.length} characters — there is room to say more.`);
		const dup = seenTitles.get(title.toLowerCase());
		if (dup) problem(file, `same title as ${dup}. Two pages competing for one phrase beat each other.`);
		else seenTitles.set(title.toLowerCase(), file);
	}

	// ── the grey snippet ──
	const desc = (data.metaDescription || data.description || '').trim();
	if (!desc) problem(file, 'no description, so Google will invent one from the page.');
	else {
		if (desc.length > LIMITS.descMax)
			note(file, `description is ${desc.length} characters; the snippet is cut near ${LIMITS.descMax}.`);
		if (desc.length < LIMITS.descMin)
			note(file, `description is only ${desc.length} characters — thin for a snippet.`);
		const dup = seenDescs.get(desc.toLowerCase());
		if (dup) note(file, `same description as ${dup}.`);
		else seenDescs.set(desc.toLowerCase(), file);
	}

	// ── the picture ──
	const hero = (data.heroImage || '').trim();
	if (!hero) problem(file, 'no hero image, so social cards will have nothing to show.');
	else {
		const onDisk = join(PUBLIC, hero.replace(/^\//, ''));
		if (!existsSync(onDisk)) problem(file, `hero image ${hero} is not in public/.`);
		else {
			const kb = Math.round(statSync(onDisk).size / 1024);
			if (kb > LIMITS.imageMaxKB)
				note(file, `hero image is ${kb}KB — over ${LIMITS.imageMaxKB}KB slows the page down.`);
		}
		if (!(data.heroAlt || '').trim())
			note(file, 'hero image has no alt text. Say what is in the picture.');
	}

	// ── the piece itself ──
	const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
	if (words < LIMITS.bodyMinWords)
		note(file, `${words} words. Under ${LIMITS.bodyMinWords} tends to read as thin.`);

	const headings = [...body.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => m[1].length);
	if (!headings.length && words > 500)
		note(file, 'no headings in a long piece — break it up with H2s.');
	if (headings.includes(1))
		note(file, 'an H1 inside the body; the page title is already the H1.');
	for (let i = 1; i < headings.length; i++) {
		if (headings[i] - headings[i - 1] > 1) {
			note(file, `heading level jumps from H${headings[i - 1]} to H${headings[i]}.`);
			break;
		}
	}

	// images written into the body with no alt text
	const noAlt = [...body.matchAll(/!\[\s*\]\(/g)].length;
	if (noAlt) note(file, `${noAlt} image${noAlt === 1 ? '' : 's'} in the body with no alt text.`);

	// a link that goes nowhere
	if (/\]\(\s*\)/.test(body)) problem(file, 'an empty link in the body.');

	if (!(data.pubDate || '').trim()) problem(file, 'no publish date.');

	if (errors + warns === before) console.log(`  ${green('all good')}`);
	console.log('');
}

console.log(
	`${errors ? red(`${errors} to fix`) : green('0 to fix')}  ·  ${
		warns ? yellow(`${warns} worth a look`) : green('0 warnings')
	}\n`
);

if (errors) {
	console.log(red('Build stopped: fix the errors above, or run the build without the check.\n'));
	process.exit(1);
}
