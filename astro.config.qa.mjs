// Local QA build only — never deployed. Same config as production but with
// the Vercel adapter swapped for a stub (the sandbox cannot write .vercel/)
// and caches kept out of the project folder.
import { fileURLToPath } from 'node:url';
import base from './astro.config.mjs';
const qaAdapter = {
	name: 'qa-stub',
	hooks: {
		'astro:config:done': ({ setAdapter }) =>
			setAdapter({
				name: 'qa-stub',
				serverEntrypoint: fileURLToPath(new URL('./scripts/qa-adapter-entry.mjs', import.meta.url)),
				exports: [],
				supportedAstroFeatures: { staticOutput: 'stable', hybridOutput: 'stable', serverOutput: 'stable', sharpImageService: 'stable' },
			}),
	},
};
export default {
	...base,
	adapter: qaAdapter,
	cacheDir: '/tmp/astro-cache',
	vite: { ...(base.vite || {}), cacheDir: '/tmp/vite-cache' },
};
