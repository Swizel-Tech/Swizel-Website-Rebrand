// Programs sits in the nav of every world, but the page itself is a Campus
// room. Following it from Builder or Studio therefore changes the world
// underneath you.
//
// The first attempt held the click, showed a pill and then navigated. It
// was easy to miss — you are looking at the link you just clicked, not at
// the bottom of the screen — and it did nothing about the actual problem,
// which is finding your way back. So: no delay and no interruption on the
// way out. We just remember which world you came from, and the Programs
// page offers you the door back.
import { views, DEFAULT_VIEW } from '../consts';

const KEY = 'swizel-came-from';

export function initProgramsNotice() {
	// ── on the way out: remember the world, switch it, let the click go ──
	if (!window.__swzProgramsNotice) {
		window.__swzProgramsNotice = true;
		document.addEventListener(
			'click',
			(e) => {
				const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
					'a[href="/programs"], a[href^="/programs#"]'
				);
				if (!link) return;
				if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') return;

				const view = document.documentElement.getAttribute('data-view') || DEFAULT_VIEW;
				if (view === 'campus') return; // already home, nothing to explain

				try {
					sessionStorage.setItem(KEY, view);
					localStorage.setItem('swizel-view', 'campus');
				} catch (err) {
					/* private mode; the page still loads, just without the door back */
				}
				document.documentElement.setAttribute('data-view', 'campus');
			},
			true
		);
	}

	// ── on arrival: if you came from elsewhere, show the door back ──
	const bar = document.querySelector<HTMLElement>('[data-came-from]');
	if (!bar) return;

	let from = '';
	try {
		from = sessionStorage.getItem(KEY) || '';
	} catch (err) {
		from = '';
	}
	if (!from || from === 'campus') return;

	const world = views.find((v) => v.id === from);
	if (!world) return;

	const name = bar.querySelector<HTMLElement>('[data-came-from-name]');
	const link = bar.querySelector<HTMLAnchorElement>('[data-came-from-link]');
	if (name) name.textContent = world.name;
	bar.style.setProperty('--from-accent', world.accent);
	bar.removeAttribute('hidden');

	link?.addEventListener('click', (e) => {
		e.preventDefault();
		try {
			localStorage.setItem('swizel-view', from);
			sessionStorage.removeItem(KEY);
		} catch (err) {
			/* nothing to clean up */
		}
		document.documentElement.setAttribute('data-view', from);
		window.location.href = '/';
	});

	bar.querySelector<HTMLElement>('[data-came-from-x]')?.addEventListener('click', () => {
		bar.setAttribute('hidden', '');
		try {
			sessionStorage.removeItem(KEY);
		} catch (err) {
			/* nothing to clean up */
		}
	});
}

declare global {
	interface Window {
		__swzProgramsNotice?: boolean;
	}
}
