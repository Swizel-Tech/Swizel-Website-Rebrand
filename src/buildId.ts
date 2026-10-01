/**
 * One stamp per build, shared by every page.
 *
 * /styles/global.css lives in public/, so Astro copies it through
 * untouched and its URL never changes — unlike everything Astro bundles,
 * which it hashes precisely so that a new build cannot be served with an
 * old file. This stamp gives that same guarantee to the one stylesheet
 * that opts out of it. See the note beside the <link> in BaseHead.
 *
 * It lives in its own module on purpose. Computed inside BaseHead's
 * frontmatter it would be evaluated once per PAGE, and Date.now() would
 * return a different value for each — thirty-five pages each asking for
 * a different stylesheet URL, which is thirty-five cache entries and no
 * reuse between pages. A module's top level runs once for the whole
 * build, so every page asks for the same one.
 *
 * On Vercel the commit SHA is both stable and meaningful: the stamp says
 * which commit the CSS came from, which is useful when a browser insists
 * it is showing something it is not.
 */
export const BUILD_ID = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
	process.env.VERCEL_DEPLOYMENT_ID?.slice(-8) ||
	Date.now().toString(36)
).replace(/[^a-zA-Z0-9]/g, '');
