// Toasts.
//
// Two bugs lived here. The notification was pinned at `top: 1rem` with no
// z-index at all, so it slid in *underneath* the 81px sticky header
// (z-index 20) — you saw it flash past the header's bottom edge and then
// vanish behind the CONTACT button. And a single shared 3.5s timer called
// a blanket reset, so a toast raised while an earlier one was still
// counting down got wiped by the OLD timer, often within a moment of
// appearing. Each toast now owns its own timer.
const timers = new Map<string, number>();

const hide = (el: HTMLElement) => {
	el.dataset.mode = 'hidden';
	el.style.removeProperty('transform');
	el.style.removeProperty('opacity');
	el.style.removeProperty('pointer-events');
	const t = timers.get(el.id);
	if (t) {
		clearTimeout(t);
		timers.delete(el.id);
	}
};

const toaster = () => {
	type Toast = 'success' | 'danger' | 'warning';

	// bound once per container, at call time rather than at module load, so a
	// swup navigation that replaces the container still gets working buttons
	const bindButtons = () => {
		document
			.querySelectorAll<HTMLButtonElement>('.toast-button')
			.forEach((btn) => {
				if (btn.dataset.toastBound) return;
				btn.dataset.toastBound = '1';
				btn.addEventListener('click', () => {
					const box = btn.closest<HTMLElement>('.toast-notification');
					if (box) hide(box);
				});
			});
	};

	const toast = (type: Toast, message: string) => {
		bindButtons();

		const id = `toast-${type}`;
		const target = document.getElementById(id);
		const messageWrapper = target?.querySelector('.toast-message');
		if (!target || !messageWrapper) return;

		// anything else on screen steps aside, but only its own timer is cleared
		document
			.querySelectorAll<HTMLElement>('.toast-notification')
			.forEach((el) => {
				if (el !== target) hide(el);
			});

		const prev = timers.get(id);
		if (prev) clearTimeout(prev);

		messageWrapper.textContent = message;
		target.dataset.mode = 'visible';
		// The shown state is set inline rather than left to a stylesheet rule.
		// The scoped `[data-mode=visible]` rule was losing to the hidden one
		// even with !important, and a notification that silently fails to
		// appear is the worst kind of bug — inline styles cannot lose.
		target.style.transform = 'none';
		target.style.opacity = '1';
		target.style.pointerEvents = 'auto';

		// long enough to actually read a sentence
		timers.set(
			id,
			window.setTimeout(() => hide(target), 6000)
		);
	};

	return toast;
};

export default toaster;
