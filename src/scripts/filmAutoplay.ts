// One rule for every film on the site.
//
// A section with a film in it starts that film by itself, a beat and a half
// after it arrives — long enough that it reads as the page settling rather
// than as an advert firing. It starts muted, because no browser will autoplay
// with sound, so the only thing left to say is "there is sound here": the
// mute control breathes until the visitor either unmutes it or touches it.
//
// Every player on the site imports from here so the beat and the hint are
// the same everywhere, instead of five copies drifting apart.

/** the beat before a film that has just come on screen starts itself */
export const FILM_DELAY = 1500;

/** the class the mute control wears while it is asking to be pressed */
export const MUTE_HINT = 'is-mutehint';

const reduced = () =>
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Run `go` once, `delay` after the element first comes properly into view.
 * Returns a teardown, and never fires at all where motion is unwelcome or
 * the machine has already told us it is struggling.
 */
export function startWhenSeen(
	el: Element,
	go: () => void,
	opts: { delay?: number; threshold?: number; skipReduced?: boolean } = {}
): () => void {
	const { delay = FILM_DELAY, threshold = 0.4, skipReduced = true } = opts;
	if (skipReduced && reduced()) return () => {};
	if (!('IntersectionObserver' in window)) {
		go();
		return () => {};
	}
	let timer = 0;
	const io = new IntersectionObserver(
		(entries) => {
			const en = entries[0];
			if (!en) return;
			if (en.isIntersecting) {
				if (timer) return;
				timer = window.setTimeout(() => {
					io.disconnect();
					go();
				}, delay);
			} else if (timer) {
				// scrolled away before the beat was up: no film starts behind
				// the visitor's back
				window.clearTimeout(timer);
				timer = 0;
			}
		},
		{ threshold }
	);
	io.observe(el);
	return () => {
		if (timer) window.clearTimeout(timer);
		io.disconnect();
	};
}

/**
 * Make the mute control breathe, and stop the moment it has been understood:
 * any press of it, or any unmute from anywhere, ends the hint for good.
 */
export function hintUnmute(...btns: (Element | null | undefined)[]) {
	const live = btns.filter(Boolean) as HTMLElement[];
	if (!live.length || reduced()) return () => {};
	let done = false;
	const stop = () => {
		if (done) return;
		done = true;
		live.forEach((b) => b.classList.remove(MUTE_HINT));
	};
	live.forEach((b) => {
		b.classList.add(MUTE_HINT);
		b.addEventListener('click', stop, { once: true });
	});
	// it has had its say after a while either way — a control that pulses
	// forever stops reading as an invitation and starts reading as a fault
	window.setTimeout(stop, 12000);
	return stop;
}
