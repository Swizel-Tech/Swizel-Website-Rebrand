// The posts the /blog index lists, newest first, shared by every world.
import { getCollection } from 'astro:content';

export async function blogPosts() {
	return (await getCollection('blog', ({ data }) => data.draft !== true)).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);
}
