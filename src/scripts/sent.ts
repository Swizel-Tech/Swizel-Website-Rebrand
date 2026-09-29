// The moment after somebody presses send.
//
// A toast in the corner is what the site used to give for this, and a
// toast is the wrong weight: writing a brief takes a few minutes and
// deserves more than a strip of text that slides away before it is read.
// This holds the screen, says what happens next, and closes on any of the
// three things a person will try — the button, escape, or the backdrop.
export interface SentOpts {
	title: string;
	body: string;
	/** the address we just wrote to, shown so they know to look for it */
	echo?: string;
	cta?: { label: string; href: string };
}

let host: HTMLElement | null = null;

function build(): HTMLElement {
	const el = document.createElement('div');
	el.className = 'sent';
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');
	el.hidden = true;
	el.innerHTML = `
		<div class="sent__veil" data-sent-close></div>
		<div class="sent__card" role="document">
			<span class="sent__ring" aria-hidden="true">
				<svg viewBox="0 0 52 52" width="52" height="52" fill="none" aria-hidden="true">
					<circle class="sent__ring-o" cx="26" cy="26" r="24" stroke="currentColor" stroke-width="2" />
					<path class="sent__tick" d="M15 27l8 8 15-16" stroke="currentColor" stroke-width="3"
						stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</span>
			<h2 class="sent__h" data-sent-title></h2>
			<p class="sent__p" data-sent-body></p>
			<p class="sent__echo" data-sent-echo hidden></p>
			<div class="sent__acts">
				<a class="sent__go" data-sent-cta hidden></a>
				<button type="button" class="sent__close" data-sent-close>Close</button>
			</div>
		</div>`;
	document.body.appendChild(el);
	return el;
}

export function showSent(opts: SentOpts) {
	if (!host) host = build();
	const q = <T extends HTMLElement>(s: string) => host!.querySelector<T>(s)!;

	q('[data-sent-title]').textContent = opts.title;
	q('[data-sent-body]').textContent = opts.body;

	const echo = q<HTMLElement>('[data-sent-echo]');
	if (opts.echo) {
		echo.textContent = `We wrote to ${opts.echo} — it should land in a minute or two.`;
		echo.hidden = false;
	} else echo.hidden = true;

	const cta = q<HTMLAnchorElement>('[data-sent-cta]');
	if (opts.cta) {
		cta.textContent = opts.cta.label;
		cta.href = opts.cta.href;
		cta.hidden = false;
	} else cta.hidden = true;

	host.hidden = false;
	// a frame, so the opening transition has a state to move from
	requestAnimationFrame(() => host!.classList.add('is-on'));
	document.documentElement.style.overflow = 'hidden';
	q<HTMLButtonElement>('.sent__close').focus();

	const close = () => {
		host!.classList.remove('is-on');
		document.documentElement.style.overflow = '';
		window.setTimeout(() => (host!.hidden = true), 260);
		document.removeEventListener('keydown', onKey);
	};
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') close();
	};

	host.querySelectorAll('[data-sent-close]').forEach((b) =>
		b.addEventListener('click', close, { once: true })
	);
	document.addEventListener('keydown', onKey);
}
