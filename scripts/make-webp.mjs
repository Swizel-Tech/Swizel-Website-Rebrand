#!/usr/bin/env node
/**
 * WebP twins for every photo the site ships.
 *
 * public/ holds 140-odd JPGs and PNGs and almost no WebP. A WebP of the
 * same picture at the same quality is usually a quarter to a third
 * smaller, and every browser the site supports has read it for years.
 *
 * For each public/**.jpg|jpeg|png this writes, beside it:
 *   name.webp        the same picture, same pixels, as WebP
 *   name-720.webp    a 720px-wide copy, when the original is wider than
 *                    1000px — what a phone actually needs
 *
 * scripts/optimize-images.mjs then points the built HTML and CSS at them.
 * Nothing in src/ changes and the dev server keeps serving the originals,
 * so a photo looks exactly the same everywhere; it just arrives sooner.
 *
 * Idempotent: a twin that already exists is left alone (delete it to remake). Runs
 * before every build (prebuild) and can be run by hand: `npm run webp`.
 * Mail signatures, BIMI, icons and the OG cards are skipped — those are
 * fetched by mail clients and crawlers that are better served the original.
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public';
const SKIP = [/^public\/email\//, /^public\/bimi\//, /^public\/icons\//, /^public\/images\/og\//];
const PHOTO = /\.(jpe?g|png)$/i;
const SMALL_WIDTH = 720;
const NEEDS_SMALL_ABOVE = 1000;

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, out);
		else if (PHOTO.test(name)) out.push(p);
	}
	return out;
}

// An existing twin is never overwritten — a few WebPs in public/ were made
// by hand before this script existed, and a regenerated one would not be
// the same picture. Delete a twin to have it made again.
const fresh = (twin) => existsSync(twin);

const files = walk(ROOT).filter((f) => !SKIP.some((re) => re.test(f)));
// "photo.jpg" and "photo.png" side by side are two different pictures
// (it happens once, in the portfolio): their twins keep the extension in
// the name so neither overwrites the other.
const stems = new Map();
for (const f of files) {
	const stem = f.slice(0, -extname(f).length);
	stems.set(stem, (stems.get(stem) || 0) + 1);
}
export const twinBase = (file) => {
	const stem = file.slice(0, -extname(file).length);
	return stems.get(stem) > 1 ? file : stem;
};

let made = 0;
let kept = 0;
let bytesIn = 0;
let bytesOut = 0;
for (const file of files) {
	const base = twinBase(file);
	const full = `${base}.webp`;
	const small = `${base}-${SMALL_WIDTH}.webp`;
	const img = sharp(file);
	const meta = await img.metadata();
	const isPng = /\.png$/i.test(file);
	// PNGs may carry transparency or flat graphics: lossless keeps them exact.
	const opts = isPng ? { lossless: true } : { quality: 82, effort: 5 };

	let ours = true;
	if (!fresh(full)) {
		await sharp(file).webp(opts).toFile(full);
		made++;
	} else {
		kept++;
		// a twin older than its source was there before this script ran,
		// and may not be a plain conversion of it (hand-made, cropped,
		// retouched). It is left alone, and not paired with a small copy
		// made from a source it may not match.
		ours = statSync(full).mtimeMs >= statSync(file).mtimeMs;
	}
	bytesIn += statSync(file).size;
	bytesOut += statSync(full).size;

	if (ours && (meta.width ?? 0) > NEEDS_SMALL_ABOVE) {
		if (!fresh(small)) {
			await sharp(file).resize({ width: SMALL_WIDTH }).webp(opts).toFile(small);
			made++;
		} else kept++;
	}
}
const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(
	`webp: ${made} written, ${kept} already current · originals ${kb(bytesIn)} → webp ${kb(bytesOut)}`
);
