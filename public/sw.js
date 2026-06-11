/* Swizel service worker — network-first for pages, stale-while-revalidate
   for static assets. Keeps the PWA installable and snappy offline.
   v2: self-destructs on localhost so development never sees stale files. */
const CACHE = 'swizel-v2';
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
