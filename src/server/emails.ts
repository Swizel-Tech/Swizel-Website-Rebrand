// The emails a person actually receives from Swizel.
//
// Built as tables with inline styles, because that is the only thing
// every mail client agrees on — Outlook still renders with Word's engine,
// Gmail strips <style> blocks, and none of them support flex or grid.
//
// Two things bit the first version and are worth saying out loud:
//
//   · Gmail refuses to render SVG. The mark has to be a PNG, and the
//     first attempt pointed at a file that did not exist, which is the
//     empty box that showed up in the inbox.
//   · Those images are fetched over the internet by the mail client, so
//     they must be absolute and on a host that is actually serving. The
//     production domain is not pointed at this site yet, so the base URL
//     is read from the environment and falls back to the deployment's own
//     address rather than to a domain that would 404.
//
// Every message also ships a plain-text part. A mail without one scores
// as spam, and some people genuinely read in plain text.
import { esc } from './mail';

const BRAND = '#28a6ec';
const INK = '#101322';
const MUTED = '#5b6076';
const LINE = '#e6e9f2';
const DEEP = '#080b14';

/** Where the images actually live. */
function base(): string {
	const e = (typeof process !== 'undefined' && process.env ? process.env : {}) as Record<
		string,
		string | undefined
	>;
	const explicit = e.PUBLIC_SITE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, '');
	// Vercel hands the deployment its own hostname; use it rather than a
	// domain that may not be pointed here yet
	const vercel = e.VERCEL_PROJECT_PRODUCTION_URL?.trim() || e.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
	return 'https://swizel.co';
}

export const FROM_NAME = 'Swizel Technologies Limited';

const SOCIALS = [
	['WhatsApp', 'https://wa.me/2348100204570'],
	['X', 'https://twitter.com/swizelhq'],
	['Instagram', 'https://instagram.com/swizelhq'],
	['LinkedIn', 'https://www.linkedin.com/company/swizel-technologies-limited/'],
	['Facebook', 'https://www.facebook.com/SWIZELTECHNOLOGIESLIMITED/'],
];

/** Both lines, side by side, so somebody abroad is not calling Nigeria. */
const PHONES = [
	['🇳🇬', '+234 810 020 4570'],
	['🇺🇸', '+1 701 498 1811'],
];

const OFFICES = [
	['Abuja', '2155 Peculiar Estate, Lokogoma'],
	['Cork', 'Eden Hall, Modern Farm Road'],
	['Sheffield', '1 Sheffield, South Yorkshire, S2 3DB'],
	['New York', 'Tiemann Ave, Bronx'],
];

interface Shell {
	preheader: string;
	heading: string;
	body: string;
	cta?: { label: string; href: string };
	/** the list mail carries a way out; the others do not */
	unsubscribe?: string;
}

function shell({ preheader, heading, body, cta, unsubscribe }: Shell) {
	const B = base();
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:26px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 14px 44px -22px rgba(16,19,34,.38);">

        <!-- ── the header band, as ONE image ──────────────────────────
             This was a white wordmark on a near-black table cell, and in
             the Gmail Android app it disappeared completely.

             Gmail applies its own colour inversion in dark mode: it flips
             backgrounds and text, and it does not touch images. So the
             near-black cell became near-white while the white wordmark
             stayed white — a white logo on a white band. Nothing in the
             message can prevent that; Gmail's app ignores meta
             color-scheme and prefers-color-scheme alike.

             So the band no longer depends on the cell. The dark
             background is baked into the PNG, which means the image
             carries its own contrast whatever the client decides to do
             around it. bgcolor stays on the cell so that a reader with
             images turned off still gets a dark band rather than a white
             gap. -->
        <tr><td bgcolor="${DEEP}" style="background:${DEEP};font-size:0;line-height:0;">
          <a href="${B}" style="text-decoration:none;display:block;">
            <img src="${B}/email/band-dark.png" width="580" alt="Swizel Technologies Limited"
                 style="display:block;width:100%;max-width:580px;border:0;outline:none;height:auto;" />
          </a>
        </td></tr>

        <!-- a hairline of the brand colour under the band -->
        <tr><td style="height:3px;background:${BRAND};font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- the body, with the mark set very faintly behind it -->
        <!-- No watermark behind the words. Three attempts at one all read
             as a grey smudge on the paragraph rather than as a mark, and
             Gmail drops background images on a cell in any case. The logo
             appears twice, deliberately: the wordmark at the top and the
             mark in the sign-off below. -->
        <tr><td style="padding:34px 30px 10px;">
          <h1 style="margin:0 0 16px;font:700 25px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};letter-spacing:-.02em;">${heading}</h1>
          <div style="font:400 15px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${MUTED};">${body}</div>
        </td></tr>

        ${
					cta
						? `<tr><td style="padding:10px 30px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:${BRAND};">
            <a href="${cta.href}" style="display:inline-block;padding:13px 28px;font:700 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#04101a;text-decoration:none;border-radius:999px;">${esc(cta.label)}</a>
          </td></tr></table>
        </td></tr>`
						: '<tr><td style="padding:0 30px 24px;"></td></tr>'
				}

        <!-- ── the footer: how to reach a person, and where we are ── -->
        <tr><td style="background:${DEEP};padding:26px 30px 24px;">

          <!-- ── the name, and the mark beside it ──
               The mark used to sit on its own under the whole card, small
               and unexplained. It belongs here, in the footer's own empty
               right-hand column, at a size you can actually see. Two
               cells rather than a positioned element, because absolute
               positioning is one of the many things Outlook's rendering
               engine does not have. -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              <td valign="top" style="padding-right:12px;">
                <p style="margin:0 0 4px;font:700 14px/1.5 -apple-system,Arial,sans-serif;color:#ffffff;">Swizel Technologies Limited</p>
                <p style="margin:0;font:400 13px/1.5 -apple-system,Arial,sans-serif;color:${BRAND};">You imagine. We build.</p>
              </td>
              <td valign="middle" align="right" width="96" style="width:96px;">
                <img src="${B}/email/mark-brand.png" width="88" height="60" alt=""
                     style="display:block;border:0;outline:none;height:auto;opacity:.95;" />
              </td>
            </tr>
          </table>

          <!-- talk to a person: both lines, side by side -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
            <tr>
              ${PHONES.map(
								([flag, num], i) =>
									`<td style="padding:0 ${i === PHONES.length - 1 ? '0' : '18px'} 0 0;font:600 13px/1.6 -apple-system,Arial,sans-serif;white-space:nowrap;">
                  <span style="opacity:.9;">${flag}</span>
                  <!-- brand blue rather than white. Gmail's dark mode
                       flips this footer from near-black to near-white but
                       does not reliably recolour text that was given an
                       explicit hex, so white numbers can end up white on
                       white. Blue is legible on both. -->
                  <a href="tel:${num.replace(/[^0-9+]/g, '')}" style="color:${BRAND};text-decoration:none;">${num}</a>
                </td>`
							).join('')}
            </tr>
          </table>

          <p style="margin:0 0 16px;font:400 13px/1.8 -apple-system,Arial,sans-serif;color:rgba(255,255,255,.72);">
            <a href="mailto:contact@swizel.co" style="color:${BRAND};text-decoration:none;">contact@swizel.co</a>
            &nbsp;·&nbsp;
            <a href="${B}" style="color:${BRAND};text-decoration:none;">swizel.co</a>
          </p>

          <!-- ── the offices, on one line each and quiet ──
               These were a four-row table with each address on its own
               row, and the channels below were four bordered pill
               buttons. Between them they gave the foot of every message
               the shape of a marketing campaign, which is one of the
               things Gmail reads when it decides between Primary and
               Promotions. The information is all still here — it is what
               makes the mail feel like it came from a real company — it
               is simply set as text rather than as furniture. -->
          <p style="margin:0 0 14px;font:400 12px/1.7 -apple-system,Arial,sans-serif;color:rgba(255,255,255,.55);">
            ${OFFICES.map(
							([city, line]) =>
								`<span style="color:rgba(255,255,255,.85);font-weight:600;">${city}</span> ${esc(line)}`
						).join('<br />')}
          </p>

          <p style="margin:0;font:400 12px/1.7 -apple-system,Arial,sans-serif;color:rgba(255,255,255,.45);">
            ${SOCIALS.map(
							([name, href]) =>
								`<a href="${href}" style="color:rgba(255,255,255,.72);text-decoration:none;">${name}</a>`
						).join('<span style="color:rgba(255,255,255,.28);"> · </span>')}
          </p>
        </td></tr>
      </table>

      <!-- The small print. The mark used to sit here on its own, 26px
           wide under the whole card, which is where you put something
           you have not decided what to do with. It is up in the footer
           now, at a size that reads as a mark rather than as a speck. -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
        <tr><td align="center" style="padding:18px 6px 0;font:400 12px/1.6 -apple-system,Arial,sans-serif;color:#8a90a6;">
          This is an automatic note. Reply to it and a person will read it.
          ${
						unsubscribe
							? `<br />Would rather not hear from us? <a href="${unsubscribe}" style="color:#7b8199;text-decoration:underline;">Unsubscribe</a> and we will take you off the list.`
							: ''
					}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const P = (t: string) => `<p style="margin:0 0 15px;">${t}</p>`;
const STRONG = (t: string) => `<strong style="color:${INK};">${t}</strong>`;

/**
 * Leaving the list. There is no subscriber database to delete a row
 * from — the list lives in an inbox — so the way out is a pre-written
 * mail to us. It is one tap, and it arrives labelled so it cannot be
 * mistaken for anything else.
 */
export function unsubscribeLink(address: string) {
	const subject = encodeURIComponent('[Unsubscribe] Remove me from the list');
	const body = encodeURIComponent(
		`Please remove ${address} from the Swizel mailing list.\n\n(Sent from the unsubscribe link in a Swizel email.)`
	);
	return `mailto:contact@swizel.co?subject=${subject}&body=${body}`;
}

/** Somebody sent a brief through the contact form. */
export function contactReply(name: string) {
	const first = esc(name.trim().split(/\s+/)[0] || 'there');
	const B = base();
	return {
		subject: 'We have your message',
		text: `Thanks for reaching out, ${first}. We've got your note.

Every submission is read directly by senior leadership, so you can count on a thoughtful response within one business day (often the same day).

Need something right away? Reach us at +234 810 020 4570 or reply straight to this email.

While we get back to you, here is a preview of what we've shipped recently: ${B}/portfolio

Swizel Technologies Limited
You imagine. We build.
contact@swizel.co · +234 810 020 4570 · swizel.co`,
		html: shell({
			preheader: 'We have your note. A reply within one business day, often the same day.',
			heading: `Thanks for reaching out, ${first}.`,
			body:
				P("We've got your note.") +
				P(
					`Every submission is read directly by senior leadership, so you can count on a thoughtful response ${STRONG('within one business day')} (often the same day).`
				) +
				P(
					`Need something right away? Reach us at <a href="tel:+2348100204570" style="color:${BRAND};text-decoration:none;font-weight:600;">+234 810 020 4570</a> or reply straight to this email.`
				) +
				P("While we get back to you, here is a preview of what we've shipped recently:"),
			cta: { label: 'See our recent work', href: `${B}/portfolio` },
		}),
	};
}

/** Somebody joined the list. */
export function subscribeReply(address: string) {
	const B = base();
	const out = unsubscribeLink(address);
	return {
		subject: "You're on the list",
		text: `You're officially on the list.

We respect your inbox. We only hit send when we've shipped something new or have an insight genuinely worth your time.

Zero noise, zero sales pitches, and you can unsubscribe with a single click anytime.

While you wait for the next update, here is what we've shared so far: ${B}/blog

To unsubscribe, reply to this email with "unsubscribe" and we will take you off the list.

Swizel Technologies Limited
You imagine. We build.
contact@swizel.co · +234 810 020 4570 · swizel.co`,
		html: shell({
			preheader: "We only send when we've shipped something or have something worth your time.",
			heading: "You're officially on the list.",
			body:
				P(
					`We respect your inbox. We only hit send when we've shipped something new or have an insight ${STRONG('genuinely worth your time')}.`
				) +
				P('Zero noise, zero sales pitches, and you can unsubscribe with a single click anytime.') +
				P("While you wait for the next update, here is what we've shared so far."),
			cta: { label: 'Read the journal', href: `${B}/blog` },
			unsubscribe: out,
		}),
	};
}

/** A student applied for IT or NYSC placement. */
export function applyReply(name: string, track: string) {
	const first = esc(name.trim().split(/\s+/)[0] || 'there');
	const B = base();
	return {
		subject: `Your ${track} application`,
		text: `Thanks for applying, ${first}.

Your application for ${track} has reached us and it is with the team now.

We read every application properly rather than filtering on keywords, so give us a few days. If you are shortlisted we will write to arrange a conversation. Either way, you will hear from us.

While you wait, this is the kind of work you would be joining: ${B}/portfolio

Swizel Technologies Limited
You imagine. We build.
career@swizel.co · +234 810 020 4570 · swizel.co`,
		html: shell({
			preheader: 'Your application has reached us and is with the team.',
			heading: `Thanks for applying, ${first}.`,
			body:
				P(`Your application for ${STRONG(esc(track))} has reached us, and it is with the team now.`) +
				P(
					'We read every application properly rather than filtering on keywords, so give us a few days. If you are shortlisted we will write to arrange a conversation. Either way, you will hear from us.'
				) +
				P('While you wait, this is the kind of work you would be joining.'),
			cta: { label: 'See our work', href: `${B}/portfolio` },
		}),
	};
}

/**
 * What lands in the Swizel inbox. It was a bare data table on a white
 * page, which looked like a system error report rather than a message
 * from our own site. Same information, same frame as everything else.
 */
export function teamNotice(kind: string, rows: [string, string][], body?: string) {
	const table = rows
		.map(
			([k, v]) =>
				`<tr>
          <td style="padding:8px 14px 8px 0;font:600 12px/1.5 -apple-system,Arial,sans-serif;color:${MUTED};white-space:nowrap;vertical-align:top;text-transform:uppercase;letter-spacing:.08em;">${esc(k)}</td>
          <td style="padding:8px 0;font:400 14px/1.6 -apple-system,Arial,sans-serif;color:${INK};border-bottom:1px solid ${LINE};">${esc(v) || '—'}</td>
        </tr>`
		)
		.join('');
	return {
		text: `${kind}\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + (body ? `\n\n---\n\n${body}\n` : '\n'),
		html: shell({
			preheader: rows.map(([k, v]) => `${k}: ${v}`).join(' · ').slice(0, 120),
			heading: kind,
			body:
				`<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${table}</table>` +
				(body
					? `<div style="margin-top:20px;padding:18px;background:#f5f7fb;border-radius:12px;border:1px solid ${LINE};white-space:pre-wrap;font:400 14px/1.7 -apple-system,Arial,sans-serif;color:${INK};">${esc(body)}</div>`
					: ''),
		}),
	};
}
