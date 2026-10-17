#!/usr/bin/env node
/**
 * Points the built pages at the WebP twins scripts/make-webp.mjs wrote,
 * and gives every photo its real size.
 *
 * Runs after the build, over the HTML and CSS in the output folder:
 *
 *   <img src="/images/x.jpg">          →  src="/images/x.webp"
 *                                         srcset="…x-720.webp 720w, …x.webp 1600w"
 *                                         sizes="auto, 100vw"   (lazy images)
 *                                         width="1600" height="900"
 *   <video poster="/images/x.jpg">     →  poster="/images/x.webp"
 *   url(/images/x.jpg) in CSS/style    →  url(/images/x.webp)
 *
 * Only when the twin actually exists in public/. Anything else — remote
 * images, the OG cards in <meta>, SVGs — is left exactly as it was.
 *
 * Why here and not in the components: 140 images across a hundred
 * thousand lines of markup, every one a hand-written <img>. Rewriting
 * them all is a day of risk for no visible change; rewriting the output
 * is one pass that cannot miss one, and the dev server keeps serving the
 * originals so nothing about authoring changes.
 *
 * The width/height pair is what stops the page jumping as photos arrive
 * (CLS). Tailwind's preflight sets img { height: auto }, so the pair
 * only informs the aspect ratio — it cannot change a layout that CSS
 * already sizes.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOTS = ['.vercel/output/static', 'dist/client', 'dist'];
const ROOT = process.env.SEO_ROOT || ROOTS.find((r) => existsSync(r));
if (!ROOT) {
	console.log('optimize-images: no build output found — nothing to do.');
	process.exit(0);
}
const PUBLIC = 'public';
const PHOTO = /^(\/[^"'?#]+?)\.(jpe?g|png)$/i;
const SMALL = 720;

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, out);
		else if (/\.(html|css)$/.test(name)) out.push(p);
	}
	return out;
}

const metaCache = new Map();
async function twin(rawSrc) {
	// paths in markup may be percent-encoded ("brix%20marketplace.jpg");
	// the file on disk is not, and the rewritten path keeps the encoding
	let src = rawSrc;
	try { src = decodeURI(rawSrc); } catch (e) {}
	const m = PHOTO.exec(src);
	if (!m) return null;
	if (metaCache.has(src)) return metaCache.get(src);
	// a twin keeps the original's extension in its name only when two
	// pictures share a stem (see make-webp.mjs); that one is tried first
	const base = existsSync(join(PUBLIC, `${src}.webp`)) ? src : m[1];
	const full = `${base}.webp`;
	const small = `${base}-${SMALL}.webp`;
	let info = null;
	if (existsSync(join(PUBLIC, full))) {
		let width = 0;
		let height = 0;
		try {
			const md = await sharp(join(PUBLIC, full)).metadata();
			width = md.width ?? 0;
			height = md.height ?? 0;
		} catch (e) {}
		info = {
			full: encodeURI(full),
			small: existsSync(join(PUBLIC, small)) ? encodeURI(small) : null,
			width,
			height,
		};
	}
	metaCache.set(src, info);
	return info;
}

const attr = (tag, name) => {
	const m = new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, 'i').exec(tag);
	return m ? (m[2] ?? m[3] ?? '') : null;
};

let imgs = 0;
let posters = 0;
let urls = 0;
let sized = 0;
let heroes = 0;

async function rewriteHtml(html) {
	// <img …>
	const tags = [...html.matchAll(/<img\b[^>]*>/gi)];
	let out = '';
	let last = 0;
	for (const t of tags) {
		let tag = t[0];
		const src = attr(tag, 'src');
		const info = src ? await twin(src) : null;
		if (info) {
			tag = tag.replace(/(\ssrc=)("[^"]*"|'[^']*')/i, `$1"${info.full}"`);
			imgs++;
			const lazy = /\sloading=["']lazy["']/i.test(tag);
			if (info.small && info.width && attr(tag, 'srcset') === null) {
				const srcset = `${info.small} ${SMALL}w, ${info.full} ${info.width}w`;
				// "auto" lets a lazily-loaded image size itself from its own
				// layout box (Chrome); the rest fall back to 100vw, which can
				// only ever over-fetch, never blur.
				const sizes = lazy ? 'auto, 100vw' : '100vw';
				tag = tag.replace(/>$/, ` srcset="${srcset}" sizes="${sizes}">`);
			}
			if (info.width && info.height && attr(tag, 'width') === null && attr(tag, 'height') === null) {
				tag = tag.replace(/>$/, ` width="${info.width}" height="${info.height}">`);
				sized++;
			}
		}
		out += html.slice(last, t.index) + tag;
		last = t.index + t[0].length;
	}
	html = out + html.slice(last);

	// ── the hero, announced in the head ──
	// The first image marked fetchpriority="high" is the hero, and the
	// largest thing on the first screen. A preload in the head lets the
	// browser ask for it with the HTML instead of after parsing to it.
	const hero = /<img\b[^>]*\sfetchpriority=["']high["'][^>]*>/i.exec(html);
	if (hero && !/rel="preload" as="image"/.test(html)) {
		const src = attr(hero[0], 'src');
		if (src && !/^https?:/.test(src)) {
			const srcset = attr(hero[0], 'srcset');
			const sizes = attr(hero[0], 'sizes');
			const link =
				`<link rel="preload" as="image" href="${src}"` +
				(srcset ? ` imagesrcset="${srcset}" imagesizes="${sizes || '100vw'}"` : '') +
				` fetchpriority="high">`;
			html = html.replace(/(<meta charset=[^>]*>)/i, `$1${link}`);
			heroes++;
		}
	}

	// <video poster="…">
	html = await replaceAsync(html, /(<video\b[^>]*\sposter=)("([^"]*)"|'([^']*)')/gi, async (m, pre, _q, a, b) => {
		const info = await twin(a ?? b ?? '');
		if (!info) return m;
		posters++;
		return `${pre}"${info.full}"`;
	});

	// url(…) in inline styles
	html = await rewriteUrls(html);
	return html;
}

async function rewriteUrls(text) {
	return replaceAsync(text, /url\(\s*(["']?)(\/[^"')\s]+\.(?:jpe?g|png))\1\s*\)/gi, async (m, q, path) => {
		const info = await twin(path);
		if (!info) return m;
		urls++;
		return `url(${q}${info.full}${q})`;
	});
}

async function replaceAsync(str, re, fn) {
	const parts = [];
	let last = 0;
	for (const m of str.matchAll(re)) {
		parts.push(str.slice(last, m.index), await fn(...m));
		last = m.index + m[0].length;
	}
	parts.push(str.slice(last));
	return parts.join('');
}

const files = walk(ROOT);
let touched = 0;
for (const file of files) {
	const before = readFileSync(file, 'utf8');
	const after = file.endsWith('.html') ? await rewriteHtml(before) : await rewriteUrls(before);
	if (after !== before) {
		writeFileSync(file, after);
		touched++;
	}
}
console.log(
	`optimize-images: ${touched} files in ${ROOT} · ${imgs} <img> to WebP (${sized} given width/height) · ${posters} posters · ${heroes} hero preloads · ${urls} url() backgrounds`
);
