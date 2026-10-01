/* Swizel service worker — network-first for pages, stale-while-revalidate
   for static assets. Keeps the PWA installable and snappy offline.
   v2: self-destructs on localhost so development never sees stale files. */
// v3 so every v2 cache is dropped on activate — anyone carrying a stale
// global.css from the old stale-while-revalidate rule gets a clean start.
const CACHE = 'swizel-v3';
const CORE = ['/', '/styles/global.css', '/manifest.webmanifest'];

const IS_DEV =
	self.location.hostname === 'localhost' ||
	self.location.hostname === '127.0.0.1';

self.addEventListener('install', (e) => {
	if (IS_DEV) {
		self.skipWaiting();
		return;
	}
	e.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(CORE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys.filter((k) => IS_DEV || k !== CACHE).map((k) => caches.delete(k))
			);
			if (IS_DEV) {
				// remove ourselves entirely and hand pages back to the network
				await self.registration.unregister();
				const clients = await self.clients.matchAll({ type: 'window' });
				clients.forEach((c) => c.navigate(c.url));
				return;
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (e) => {
	if (IS_DEV) return; // dev: always hit the network
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return;

	// Pages: network first so content stays fresh, cache as fallback.
	if (req.mode === 'navigate') {
		e.respondWith(
			fetch(req)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE).then((c) => c.put(req, copy));
					return res;
				})
				.catch(() => caches.match(req).then((m) => m || caches.match('/')))
		);
		return;
	}

	// ── the stylesheet is not an ordinary asset ──────────────────────
	//
	// Everything below is stale-while-revalidate: serve the cached copy
	// now, fetch a fresh one for next time. That is right for anything
	// with a hashed filename, because a new build produces a new URL and
	// the cache can never be wrong.
	//
	// /styles/global.css has no hash. Its URL never changes, so after a
	// deploy the first visit was served the PREVIOUS build's stylesheet
	// and only picked up the new one on a second load. Since that one
	// file carries the whole design, a deploy appeared not to have
	// happened — you would fix the nav, ship it, look, and see the old
	// nav. Reload and it was suddenly fine.
	//
	// So the stylesheet goes network-first like a page: fresh when the
	// network answers, cached only when it does not.
	if (url.pathname.endsWith('.css')) {
		e.respondWith(
			fetch(req)
				.then((res) => {
					if (res.ok) {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put(req, copy));
					}
					return res;
				})
				.catch(() => caches.match(req))
		);
		return;
	}

	// Assets: serve from cache, refresh in the background.
	e.respondWith(
		caches.match(req).then((cached) => {
			const fresh = fetch(req)
				.then((res) => {
					if (res.ok) {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put(req, copy));
					}
					return res;
				})
				.catch(() => cached);
			return cached || fresh;
		})
	);
});
