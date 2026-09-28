// The blog's "what we write about" cards.
//
// Each card is a <label> for one of the journal's filter radios, so
// pressing it already filters the grid with no script at all. The
// trouble is that the grid is further up the page, so on its own the
// press looks like it did nothing: the work happened off screen.
//
// So this walks the reader back to the journal after the press. That is
// all it does — the filtering itself stays in CSS, and the page still
// works with this file missing.
export function initBlogBeats() {
	const beats = Array.from(document.querySelectorAll<HTMLLabelElement>('[data-bl-beat]'));
	if (!beats.length) return;
	const journal = document.getElementById('bl-journal');
	if (!journal) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	beats.forEach((beat) => {
		if (beat.dataset.blBeatReady === '1') return;
		beat.dataset.blBeatReady = '1';
		beat.addEventListener('click', () => {
			// after the label has done its own job, not instead of it
			window.setTimeout(() => {
				journal.scrollIntoView({
					behavior: reduce ? 'auto' : 'smooth',
					block: 'start',
				});
			}, 60);
		});
	});
}
