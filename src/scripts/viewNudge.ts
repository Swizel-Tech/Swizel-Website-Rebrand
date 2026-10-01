/**
 * After the site reshapes itself around you, point at the way back.
 *
 * Picking a world from the quiz is fast — a few seconds from the second
 * answer to a completely different home page — and the thing that makes
 * that feel good rather than disorienting is knowing it is reversible.
 * The control that reverses it is the Views button in the nav, which is
 * a small grid of four squares that nobody has any reason to have
 * noticed yet.
 *
 * So once, on the first page the visitor lands on after choosing, it
 * pulses. Three breaths and it stops: enough to catch the eye on the way
 * past, not enough to become something flashing in the corner of a page
 * somebody is trying to read.
 *
 * Why a flag in sessionStorage rather than just animating on the spot:
 * choosing a world from /about navigates home, so the button that needs
 * to pulse belongs to a page that does not exist yet at the moment of
 * choosing. The flag survives that trip. It is sessionStorage, not
 * localStorage, because a nudge is for this visit — nobody should meet
 * it again next week.
 */

const NUDGE_KEY = 'swizel-view-nudge';

/** Called by applyView the moment a world is chosen. */
export function armViewNudge() {
	try {
		sessionStorage.setItem(NUDGE_KEY, '1');
	} catch (e) {}
}

/**
 * In the MainLayout init list, so it runs on first load AND on every swup
 * contentReplaced — the nav is re-rendered by the swap, so a class set on
 * the old button would be thrown away with it.
 */
export function initViewNudge() {
	let armed = false;
	try {
		armed = !!sessionStorage.getItem(NUDGE_KEY);
	} catch (e) {}
	if (!armed) return;

	const targets = document.querySelectorAll<HTMLElement>('[data-open-views]');
	if (!targets.length) return;

	// Respect the setting, and still clear the flag — otherwise it waits in
	// storage for the rest of the session and fires at some unrelated
	// moment later on.
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	try {
		sessionStorage.removeItem(NUDGE_KEY);
	} catch (e) {}
	if (reduce) return;

	// The modal is closing as this runs and the page is still settling into
	// the new world; a pulse underneath all that is a pulse nobody sees.
	// Let it land first.
	window.setTimeout(() => {
		targets.forEach((el) => {
			el.classList.add('is-nudging');
			// Take the class off when the animation finishes rather than on a
			// matching timeout, so the two can never drift apart — and fall
			// back to a timer in case the element is display:none (the drawer
			// copy is), where no animation runs and no event ever fires.
			const done = () => el.classList.remove('is-nudging');
			el.addEventListener('animationend', done, { once: true });
			window.setTimeout(done, 4200);
		});
	}, 900);
}
