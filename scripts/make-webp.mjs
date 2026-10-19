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
 *   name-360.webp    narrower copies — 360, 720 and 1080px wide — each
 *   name-720.webp    one only when the picture is comfortably wider than
 *   name-1080.webp   it, so a 70px avatar and a 3600px portfolio shot
 *                    both have a size that fits their box (a phone at
 *                    2–3× pixel density needs ~200px for that avatar,
 *                    not 800)
 *
 * Hand-made WebPs (a .webp in public/ with no JPG/PNG beside it, or one
 * older than its source) get the same narrower copies, cut from the WebP
 * itself, so what is shown is always the same picture.
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
const HANDMADE = /\.webp$/i;
const VARIANT = /-(\d{3,4})\.webp$/i;
// widths of the narrower copies; a copy is only cut when the source is
// at least 30% wider than it, so nothing is upscaled or near-duplicated
const LADDER = [360, 720, 1080];
const NEEDS_ABOVE = 1.3;

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, out);
		else if (PHOTO.test(name)) out.push(p);
		else if (HANDMADE.test(name) && !VARIANT.test(name)) out.push(p);
	}
	return out;
}

// An existing twin is never overwritten — a few WebPs in public/ were made
// by hand before this script existed, and a regenerated one would not be
// the same picture. Delete a twin to have it made again.
const fresh = (twin) => existsSync(twin);

// stray copies that have turned up beside the real pictures
// ("x.png.jpeg", "x-1080.jpeg") are not sources: nothing is cut from them
const STRAY = /(\.(jpe?g|png|webp)|-\d{3,4})\.jpe?g$/i;
const all = walk(ROOT).filter((f) => !SKIP.some((re) => re.test(f)) && !STRAY.test(f));
const files = all.filter((f) => PHOTO.test(f));
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

// a .webp that is not the twin of any JPG/PNG is a hand-made picture in
// its own right (beauty-hive.webp, the retouched tellatrust-design.webp)
const twins = new Set(files.map((f) => `${twinBase(f)}.webp`));
const handmade = all.filter((f) => HANDMADE.test(f) && !twins.has(f));

let made = 0;
let kept = 0;
let bytesIn = 0;
let bytesOut = 0;
for (const file of files) {
	const base = twinBase(file);
	const full = `${base}.webp`;
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

	// the narrower copies are cut from whichever WebP is actually shown:
	// our own conversion, or the hand-made twin that predates this script
	const master = ours ? file : full;
	// resized copies are lossy even for PNGs: at a fraction of the size
	// the detail is gone anyway, and transparency survives either way
	await ladder(master, base, { quality: 82, effort: 5 });
}
for (const file of handmade) {
	await ladder(file, file.slice(0, -5), { quality: 82, effort: 5 });
}

async function ladder(master, base, opts) {
	const width = (await sharp(master).metadata()).width ?? 0;
	for (const w of LADDER) {
		if (width < w * NEEDS_ABOVE) continue;
		const out = `${base}-${w}.webp`;
		if (fresh(out)) {
			kept++;
			continue;
		}
		await sharp(master).resize({ width: w }).webp(opts).toFile(out);
		made++;
	}
}
const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(
	`webp: ${made} written, ${kept} already current · originals ${kb(bytesIn)} → webp ${kb(bytesOut)}`
);
