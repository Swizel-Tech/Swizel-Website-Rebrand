// The founder contact desk.
//
// Two small jobs: keep the clock on the wall honest, and let a founder pick
// what they are before they start typing, so the message does not begin with
// a blank box.

const OPEN_HOUR = 9;
const SHUT_HOUR = 18;

function setupClock(root: HTMLElement) {
	const face = root.querySelector<HTMLElement>('[data-fct-time]');
	const state = root.querySelector<HTMLElement>('[data-fct-state-t]');
	const shell = root.querySelector<HTMLElement>('[data-fct-clock]');
	if (!face) return;

	const tick = () => {
		// Abuja is WAT, UTC+1 all year, so this needs no timezone database
		const now = new Date();
		const wat = new Date(now.getTime() + (now.getTimezoneOffset() + 60) * 60000);
		const h = wat.getHours();
		const day = wat.getDay(); // 0 Sun … 6 Sat
		face.textContent = `${String(h).padStart(2, '0')}:${String(wat.getMinutes()).padStart(2, '0')}`;

		const weekday = day >= 1 && day <= 5;
		const open = weekday && h >= OPEN_HOUR && h < SHUT_HOUR;
		shell?.classList.toggle('is-shut', !open);
		if (!state) return;
		if (open) {
			state.textContent = 'Someone is on the floor now';
		} else if (weekday && h < OPEN_HOUR) {
			state.textContent = `The floor opens at ${OPEN_HOUR}:00`;
		} else if (weekday) {
			state.textContent = 'Off the floor — first thing tomorrow';
		} else {
			state.textContent = 'Weekend — first thing Monday';
		}
	};

	tick();
	window.setInterval(tick, 20000);
}

function setupRoutes(root: HTMLElement) {
	const picks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-fct-pick]'));
	if (!picks.length) return;
	const msg = root.querySelector<HTMLTextAreaElement | HTMLInputElement>(
		'[name="message"]'
	);
	const hint = root.querySelector<HTMLElement>('[data-fct-hint]');

	picks.forEach((p) =>
		p.addEventListener('click', () => {
			const seed = p.dataset.seed || '';
			const on = p.classList.toggle('is-on');
			// one route at a time: they are describing one thing
			if (on) picks.forEach((o) => o !== p && o.classList.remove('is-on'));
			if (!msg) return;
			const body = msg.value.trim();
			if (on) {
				// drop any other route's opening line before writing this one
				let rest = body;
				picks.forEach((o) => {
					const s = o.dataset.seed || '';
					if (s && s !== seed && rest.startsWith(s)) rest = rest.slice(s.length).trimStart();
				});
				msg.value = rest ? `${seed}\n\n${rest}` : seed;
				if (hint) hint.textContent = 'Opening line written — take it from there';
				msg.focus();
				try {
					(msg as HTMLTextAreaElement).setSelectionRange(msg.value.length, msg.value.length);
				} catch (e) {}
			} else if (body.startsWith(seed)) {
				msg.value = body.slice(seed.length).trimStart();
				if (hint) hint.textContent = 'Tell us the rest';
			}
		})
	);
}

export function initContactFounder() {
	document.querySelectorAll<HTMLElement>('.fct').forEach((root) => {
		if (root.dataset.fctBound === '1') return;
		root.dataset.fctBound = '1';
		setupClock(root);
		setupRoutes(root);
	});
}
