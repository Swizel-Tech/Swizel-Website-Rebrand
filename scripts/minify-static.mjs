#!/usr/bin/env node
/**
 * Minifies the hand-written files that ship from public/ untouched.
 *
 * Everything Astro bundles is minified by the build. /styles/global.css
 * and /sw.js are copied through as written — 103 KB of commented CSS
 * served to every visitor. This squeezes the copies in the build output
 * (never the sources) with esbuild, which the project already has.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';

const ROOTS = ['.vercel/output/static', 'dist/client', 'dist'];
const ROOT = process.env.SEO_ROOT || ROOTS.find((r) => existsSync(r));
if (!ROOT) {
	console.log('minify-static: no build output found — nothing to do.');
	process.exit(0);
}

const FILES = [
	['styles/global.css', 'css'],
	['sw.js', 'js'],
];
for (const [rel, loader] of FILES) {
	const file = join(ROOT, rel);
	if (!existsSync(file)) continue;
	const src = readFileSync(file, 'utf8');
	const { code } = await transform(src, { loader, minify: true });
	writeFileSync(file, code);
	console.log(`minify-static: ${rel} ${Math.round(src.length / 1024)} KB → ${Math.round(code.length / 1024)} KB`);
}
