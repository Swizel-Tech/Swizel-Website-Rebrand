# The logo in Gmail's avatar circle

Gmail draws a letter — the "C" of contact@ — whenever it has no verified
logo for a sender. There is no code change, email header or template
tweak that replaces it. The only mechanism is **BIMI**, and BIMI will not
display without a paid certificate.

What has to be true, in order:

1. **DMARC at enforcement.** swizel.co currently publishes
   `v=DMARC1; p=none;`. BIMI requires `p=quarantine` or `p=reject` with
   `pct=100`. Do not change this casually — anything that sends as
   swizel.co and is not SPF- or DKIM-aligned starts going to spam the day
   it is tightened. Mail from the website is fine (Resend is aligned);
   what needs checking first is anything sent from the cPanel server or
   from a phone's mail app.

2. **A certificate.** Two kinds, and the cheaper one now fits Swizel:
   - **VMC** — needs a logo registered as a trademark with a recognised
     office (USPTO, EUIPO, UK IPO, IP Australia). Gives the avatar AND
     Gmail's blue verified tick, and works in Apple Mail.
   - **CMC** — needs only twelve months of continuous public use of the
     logo on the sending domain, which Swizel has comfortably. Gives the
     Gmail avatar, no tick, and no Apple Mail.
   Both are annual and paid; the CMC is the cheaper of the two and needs
   no trademark.

3. **This file, published, and a DNS record pointing at it.**

   ```
   default._bimi.swizel.co  TXT  "v=BIMI1; l=https://www.swizel.co/bimi/logo.svg; a=https://www.swizel.co/bimi/cert.pem"
   ```

   The `a=` part is the certificate and is what makes Gmail display it.
   Without it the record is valid and ignored.

## About logo.svg

BIMI does not accept an ordinary SVG. It must be **SVG Tiny 1.2 Portable
Secure** — a deliberately small profile with no scripts, no external
references, no animation, no `x`/`y` on the root element, a square
viewBox and a `<title>`. Most exports from design tools fail it.

This one is hand-built from the three paths of the Swizel mark in
public/swizel.svg, centred in a 512 square on the brand's own near-black,
and checked against every rule above. 583 bytes.

If the mark ever changes, regenerate rather than export: the transform is
computed from the path bounds so the mark sits dead centre at whatever
size Gmail crops it to.
