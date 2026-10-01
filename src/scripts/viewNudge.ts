/**
 * After the site reshapes itself around you, point at the way back.
 *
 * Picking a world from the quiz is fast — a few seconds from the second
 * answer to a completely different home page — and the thing that makes
 * that feel good rather than disorienting is knowing it is reversible.
 * The control that reverses it is the Views button in the nav, which is
 * a small grid of four squares that nobody has any reason to have
 * noticed yet. So once, it pulses.
 *
 * TWO WAYS IN, BECAUSE THERE ARE TWO WAYS A WORLD GETS PICKED
 *
 * Choosing from /about navigates home, so the button that needs to
 * pulse belongs to a page that does not exist yet at the moment of
 * choosing — the flag has to survive the trip, and the pulse has to be
 * fired by whatever runs on arrival.
 *
 * But the common case is choosing while ALREADY on the home page, where
 * applyView changes an attribute and nothing navigates at all. The
 * first version of this only listened for the arrival, so in the common
 * case nothing ever fired it and the pulse did not appear until the
 * visitor happened to reload the page by hand. That is the bug this
 * file is shaped around.
 *
 * So arming does both: it sets the flag AND schedules the pulse itself.
 * The delay outlasts a swup swap, so by the time it runs the nav on
 * screen is the final one either way, and the elements are looked up at
 * that moment rather than captured early. initViewNudge stays in the
 * layout's init list to cover the remaining case — a full page load,
 * where the timer died with the old document but the flag did not.
 *
 * Whichever gets there first clears the flag, so it fires once.
 *
 * sessionStorage, not localStorage: a nudge is for this visit. Nobody
 * should meet it again next week.
 */

const NUDGE_KEY = 'swizel-view-nudge';

/** Long enough for the modal to finish closing and a swup swap to land. */
const HOLD = 900;
/** 1.25s x 5 beats, plus margin — the backstop if animationend never comes. */
const RUN = 7000;

let fired = false;

function clearFlag() {
	try {
		sessionStorage.removeItem(NUDGE_KEY);
	} catch (e) {}
}

function isArmed() {
	try {
		return !!sessionStorage.getItem(NUDGE_KEY);
	} catch (e) {
		return false;
	}
}

/**
 * Mark whatever Views controls are on screen right now. Looked up at call
 * time, never earlier: between arming and firing, swup may have replaced
 * the entire header, and a reference captured before that would be
 * pointing at a node no longer in the document.
 */
function pulse() {
	if (fired) return;
	const targets = document.querySelectorAll<HTMLElement>('[data-open-views]');
	if (!targets.length) return; // nothing to mark; leave the flag for the next page

	fired = true;
	clearFlag();

	targets.forEach((el) => {
		el.classList.add('is-nudging');
		// Take the class off when the animation ends rather than on a
		// matching timeout, so the two cannot drift apart — with a timer as
		// backstop, because the drawer copy is display:none and fires no
		// animation event at all.
		const done = () => el.classList.remove('is-nudging');
		el.addEventListener('animationend', done, { once: true });
		window.setTimeout(done, RUN);
	});
}

/**
 * Called by applyView the moment a world is chosen — see viewExperience.ts.
 * Arms the flag for a page that is about to be navigated to, and fires the
 * pulse directly for the far more common case where nothing navigates.
 */
export function armViewNudge() {
	fired = false;
	try {
		sessionStorage.setItem(NUDGE_KEY, '1');
	} catch (e) {}
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		clearFlag();
		return;
	}
	window.setTimeout(pulse, HOLD);
}

/**
 * In the layout's init list, so it runs on first load and on every swup
 * contentReplaced. This is the arrival half: a world picked on another
 * page, or a full reload that killed the timer above.
 */
export function initViewNudge() {
	if (!isArmed()) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		clearFlag();
		return;
	}
	fired = false;
	window.setTimeout(pulse, HOLD);
}
