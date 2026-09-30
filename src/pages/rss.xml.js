// The feed, which has not worked in a while.
//
// Two separate breakages, both silent:
//
// 1. The handler was exported as `get`, lowercase. That is the Astro 2
//    signature; Astro removed it in v3, and the build has been printing
//    "No API Route handler exists for the method GET for the route
//    /rss.xml" on every run. So /rss.xml has been answering nothing.
//
// 2. @astrojs/rss is pinned at 2.4.4 here, three majors behind, and in
//    that version `rss()` resolves to `{ body }` — the shape the old
//    `get()` API expected — rather than to a Response. Simply renaming
//    the export to GET therefore swapped one build error for another:
//    "An endpoint must return either a Response, or a Promise that
//    resolves with a Response."
//
// Rather than pin the fix to one version of the package, the result is
// normalised: if it is already a Response it is returned as-is, and if
// it is the old { body } shape it is wrapped in one. That works on 2.x
// today and will keep working when the dependency is bumped.
//
// prerender is explicit because the Vercel adapter is installed, and an
// endpoint with no opinion was being built as a serverless function. A
// feed that changes when a post is published has no business costing an
// invocation.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export const prerender = true;

export async function GET(context) {
	// Drafts were included, and the items came out in whatever order the
	// collection happened to be read in. A reader shows the first item
	// first, so the order is not cosmetic.
	const posts = (await getCollection('blog', ({ data }) => data.draft !== true)).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);

	const result = await rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.metaDescription || post.data.description,
			link: `/blog/${post.slug}/`,
		})),
		customData: '<language>en-NG</language>',
	});

	if (result instanceof Response) return result;

	return new Response(result.body, {
		status: 200,
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}
