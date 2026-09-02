// Programs sits in the nav of every world, but the page itself is a
// Campus room. Following it from Builder or Studio therefore changes the
// world underneath you, which is disorienting if nobody says so. This
// intercepts the click, says one sentence, switches the world, and then
// goes — about half a second, no dialog to dismiss.
import { DEFAULT_VIEW } from '../consts';

export function initProgramsNotice() {
	if (window.__swzProgramsNotice) return;
	window.__swzProgramsNotice = true;

	const HOLD = 1150;

	document.addEventListener(
		'click',
		(e) => {
			const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
				'a[href="/programs"], a[href^="/programs#"]'
			);
			if (!link) return;
			// let a new tab, a download or a modified click behave normally
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') return;

			const view = document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
			if (view === 'campus') return; // already home, nothing to explain

			e.preventDefault();

			const el = document.createElement('div');
			el.className = 'nav-programs-notice';
			el.setAttribute('role', 'status');
			el.innerHTML =
				'<i>&#9788;</i><span>Programs lives in the <b>Campus</b> world. Taking you there.</span>';
			document.body.appendChild(el);
			// a timer, not rAF: a backgrounded or throttled tab never runs the
			// frame callback and the notice would never appear
			window.setTimeout(() => el.classList.add('is-on'), 20);

			// set the world before we go, so the page arrives already dressed
			try {
				localStorage.setItem('swizel-view', 'campus');
			} catch (err) {
				/* private mode; the page will still load */
			}
			document.documentElement.setAttribute('data-view', 'campus');

			window.setTimeout(() => {
				el.classList.remove('is-on');
				window.location.href = link.getAttribute('href') || '/programs';
			}, HOLD);
		},
		true
	);
}

declare global {
	interface Window {
		__swzProgramsNotice?: boolean;
	}
}
