#!/usr/bin/env node
/**
 * Tells every per-world page which stylesheets its sibling worlds use.
 *
 * Switching worlds is a swup navigation to another prerendered page, and
 * the page transition will wait up to 3 s for that page's stylesheets.
 * The browser only learns which stylesheets those are once the new HTML
 * has arrived — so on a slow connection the CSS started late, the 3 s
 * ran out, and the page was swapped in unstyled.
 *
 * This runs after the build. For each page that exists per world it
 * writes, onto <main id="swup">, a data-world-css attribute: a JSON map
 * of the OTHER worlds' stylesheet URLs for the same page. viewSwitch.ts
 * reads it and asks for the chosen world's CSS the instant it is chosen,
 * in parallel with the HTML. By the time the swap is due the styles are
 * already here, and the 3 s limit stays a limit nobody meets.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOTS = ['.vercel/output/static', 'dist/client', 'dist'];
const ROOT = process.env.SEO_ROOT || ROOTS.find((r) => existsSync(r));
if (!ROOT) {
	console.log('world-css-manifest: no build output found — nothing to do.');
	process.exit(0);
}

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (name.endsWith('.html')) out.push(p);
	}
	return out;
}
const PREFIX = /^\/v\/(boardroom|builder|founder|campus|studio)(?=\/|$)/;
const urlOf = (file) => {
	const rel = '/' + relative(ROOT, file).split(sep).join('/');
	return rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
};

// group: clean path → { world: { file, css[] } }
const groups = new Map();
for (const file of walk(ROOT)) {
	const html = readFileSync(file, 'utf8');
	const world = /<html[^>]*\sdata-world="([a-z]+)"/.exec(html)?.[1];
	if (!world) continue;
	const url = urlOf(file);
	const clean = url.replace(PREFIX, '') || '/';
	const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
	if (!groups.has(clean)) groups.set(clean, {});
	groups.get(clean)[world] = { file, css, html };
}

// The Views card, used anywhere but the home page, goes to the HOME page
// in the chosen world (viewExperience.ts). So every other page is also
// told what the home page needs in each world — data-home-css.
const home = groups.get('/') || {};

let written = 0;
for (const [clean, worlds] of groups) {
	for (const [world, page] of Object.entries(worlds)) {
		const others = {};
		for (const [w, p] of Object.entries(worlds)) {
			if (w === world) continue;
			// only what this page does not already have
			others[w] = p.css.filter((c) => !page.css.includes(c));
		}
		const json = JSON.stringify(others).replace(/'/g, '&#39;');
		let homeAttr = '';
		if (clean !== '/') {
			const homes = {};
			for (const [w, p] of Object.entries(home)) homes[w] = p.css.filter((c) => !page.css.includes(c));
			homeAttr = ` data-home-css='${JSON.stringify(homes).replace(/'/g, '&#39;')}'`;
		}
		const out = page.html.replace(/<main id="swup"([^>]*)>/, (m, attrs) =>
			attrs.includes('data-world-css') ? m : `<main id="swup"${attrs} data-world-css='${json}'${homeAttr}>`
		);
		if (out !== page.html) {
			writeFileSync(page.file, out);
			written++;
		}
	}
}
console.log(`world-css-manifest: ${written} pages told about their sibling worlds' stylesheets (${groups.size} page groups)`);
