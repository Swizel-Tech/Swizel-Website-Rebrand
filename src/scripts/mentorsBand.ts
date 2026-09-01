// The mentors band follows the pointer with a soft light. One listener
// per card, coordinates written once per frame — the same discipline the
// custom cursor uses, so a hover here never costs a dropped frame.
export function initMentorsBand() {
	document.querySelectorAll<HTMLElement>('[data-mentors]').forEach((card) => {
		if (card.dataset.mbBound === '1') return;
		card.dataset.mbBound = '1';

		let raf = 0;
		let x = 0;
		let y = 0;

		const write = () => {
			raf = 0;
			card.style.setProperty('--mx', x + 'px');
			card.style.setProperty('--my', y + 'px');
		};

		card.addEventListener(
			'pointermove',
			(e) => {
				const r = card.getBoundingClientRect();
				x = e.clientX - r.left;
				y = e.clientY - r.top;
				if (!raf) raf = requestAnimationFrame(write);
			},
			{ passive: true }
		);

		card.addEventListener('pointerleave', () => {
			if (raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
			card.style.removeProperty('--mx');
			card.style.removeProperty('--my');
		});
	});
}
