// The emails a person actually receives from Swizel.
//
// Written as tables with inline styles, because that is the only thing
// every mail client agrees on — Outlook still renders with Word's engine,
// Gmail strips <style> blocks, and none of them support flex or grid.
// Dark backgrounds are used sparingly for the same reason: Gmail's dark
// mode inverts some colours and not others.
//
// Every one of these also ships a plain-text version. A mail with no text
// part scores as spam, and some people genuinely read in plain text.
import { esc } from './mail';

const BRAND = '#28a6ec';
const INK = '#14162a';
const MUTED = '#5b6076';
const SITE = 'https://swizel.co';

interface Shell {
	preheader: string;
	heading: string;
	body: string;
	cta?: { label: string; href: string };
}

/**
 * The frame every Swizel email sits in: the mark, a headline, the words,
 * an optional button, and a footer that says who we are and how to reach
 * a human.
 */
function shell({ preheader, heading, body, cta }: Shell) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;">
  <!-- the line shown in the inbox list, next to the subject -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -20px rgba(20,22,40,.35);">

        <!-- the mark, on the deep blue the site opens on -->
        <tr><td style="background:#090b16;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <img src="${SITE}/swizel-mark.png" width="26" height="26" alt=""
                   style="display:block;border:0;" />
            </td>
            <td style="vertical-align:middle;padding-left:10px;">
              <span style="font:700 17px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#ffffff;letter-spacing:.14em;">SWIZEL</span>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:32px 28px 8px;">
          <h1 style="margin:0 0 14px;font:700 24px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};letter-spacing:-.02em;">${heading}</h1>
          <div style="font:400 15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${MUTED};">${body}</div>
        </td></tr>

        ${
					cta
						? `<tr><td style="padding:8px 28px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:${BRAND};">
            <a href="${cta.href}" style="display:inline-block;padding:12px 26px;font:700 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#04101a;text-decoration:none;border-radius:999px;">${esc(cta.label)}</a>
          </td></tr></table>
        </td></tr>`
						: '<tr><td style="padding:0 28px 22px;"></td></tr>'
				}

        <tr><td style="padding:0 28px;">
          <div style="height:1px;background:#e6e9f2;"></div>
        </td></tr>

        <tr><td style="padding:20px 28px 26px;">
          <p style="margin:0 0 6px;font:700 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};">Swizel Technologies Limited</p>
          <p style="margin:0 0 12px;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${MUTED};">
            You imagine. We build.<br />
            2155 Peculiar Estate, Lokogoma, Abuja &middot; Nigeria &middot; Ireland &middot; UK &middot; US
          </p>
          <p style="margin:0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${MUTED};">
            <a href="mailto:contact@swizel.co" style="color:${BRAND};text-decoration:none;">contact@swizel.co</a>
            &nbsp;&middot;&nbsp;
            <a href="tel:+2348100204570" style="color:${BRAND};text-decoration:none;">+234 810 020 4570</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" style="color:${BRAND};text-decoration:none;">swizel.co</a>
          </p>
        </td></tr>
      </table>

      <p style="margin:16px 0 0;font:400 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#8a90a6;">
        This is an automatic note. Reply to it and a person will read it.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

const P = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`;

/** Somebody sent a brief through the contact form. */
export function contactReply(name: string) {
	const first = esc(name.trim().split(/\s+/)[0] || 'there');
	return {
		subject: 'We have your message — Swizel',
		text: `Hi ${first},

Thanks for writing to Swizel. Your message is in, and a senior person reads every one of these — not a queue.

You will hear back from us within one business day, usually the same day. If it is urgent, call +234 810 020 4570 or reply to this email.

In the meantime, our recent work is at ${SITE}/portfolio.

Swizel Technologies Limited
You imagine. We build.
contact@swizel.co · +234 810 020 4570 · ${SITE}`,
		html: shell({
			preheader: 'Your message is in. We reply within one business day.',
			heading: `Thanks, ${first} — we have it.`,
			body:
				P('Your message is in, and a senior person reads every one of these — not a form queue.') +
				P('You will hear back <strong style="color:#14162a;">within one business day</strong>, usually the same day. If it is urgent, call us on <a href="tel:+2348100204570" style="color:#28a6ec;text-decoration:none;">+234 810 020 4570</a>, or simply reply to this email.') +
				P('While you wait, here is some of what we have shipped.'),
			cta: { label: 'See our work', href: `${SITE}/portfolio` },
		}),
	};
}

/** Somebody joined the list. */
export function subscribeReply() {
	return {
		subject: 'You are on the list — Swizel',
		text: `You are on the list.

We write when something ships or when something is genuinely worth knowing — which is not often. No noise, no selling, and one click to leave whenever you like.

Our writing so far is at ${SITE}/blog.

Swizel Technologies Limited
You imagine. We build.
contact@swizel.co · ${SITE}`,
		html: shell({
			preheader: 'One short note when something ships. No noise, no selling.',
			heading: 'You are on the list.',
			body:
				P('We write when something ships, or when something is genuinely worth knowing — which is not often.') +
				P('No noise, no selling, and one click to leave whenever you like.') +
				P('Here is what we have written so far.'),
			cta: { label: 'Read the journal', href: `${SITE}/blog` },
		}),
	};
}

/** A student applied for IT or NYSC placement. */
export function applyReply(name: string, track: string) {
	const first = esc(name.trim().split(/\s+/)[0] || 'there');
	return {
		subject: `Your ${track} application — Swizel`,
		text: `Hi ${first},

Your application for ${track} has reached us, and it is with the team now.

We read every application properly rather than filtering on keywords, so give us a few days. If you are shortlisted we will write to arrange a conversation; either way, you will hear from us.

Swizel Technologies Limited
You imagine. We build.
career@swizel.co · ${SITE}`,
		html: shell({
			preheader: 'Your application has reached us and is with the team.',
			heading: `Got it, ${first}.`,
			body:
				P(`Your application for <strong style="color:#14162a;">${esc(track)}</strong> has reached us, and it is with the team now.`) +
				P('We read every application properly rather than filtering on keywords, so give us a few days. If you are shortlisted we will write to arrange a conversation — and either way, you will hear from us.') +
				P('While you wait, this is the kind of work you would be joining.'),
			cta: { label: 'See our work', href: `${SITE}/portfolio` },
		}),
	};
}

/** What lands in the Swizel inbox. Plain, scannable, with everything in it. */
export function teamNotice(
	kind: string,
	rows: [string, string][],
	body?: string
) {
	const table = rows
		.map(
			([k, v]) =>
				`<tr><td style="padding:7px 12px 7px 0;font:600 13px/1.5 -apple-system,Arial,sans-serif;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:7px 0;font:400 14px/1.6 -apple-system,Arial,sans-serif;color:${INK};">${esc(v) || '—'}</td></tr>`
		)
		.join('');
	return {
		text:
			`${kind}\n\n` +
			rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
			(body ? `\n\n---\n\n${body}\n` : '\n'),
		html: shell({
			preheader: rows.map(([k, v]) => `${k}: ${v}`).join(' · ').slice(0, 120),
			heading: kind,
			body:
				`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${table}</table>` +
				(body
					? `<div style="margin-top:18px;padding:16px;background:#f5f7fb;border-radius:10px;border:1px solid #e6e9f2;white-space:pre-wrap;font:400 14px/1.65 -apple-system,Arial,sans-serif;color:${INK};">${esc(body)}</div>`
					: ''),
		}),
	};
}
