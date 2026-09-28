import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
		heroImage: z.string(),
		// — added for the redesigned blog + /admin CMS —
		category: z.string().default('Insights'),
		author: z.string().default('Swizel Team'),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),

		// ── the search fields ────────────────────────────────────────
		// `description` was doing two jobs: the blurb on the card and the
		// snippet in Google. They want different lengths — a card reads
		// better at about 120 characters, a result is cut off after about
		// 160 — so each has its own field. Both optional: leave them out
		// and the post falls back to the title and the description, which
		// is what every existing post does.
		/** Overrides the <title> in search results only. ~60 characters. */
		seoTitle: z.string().optional(),
		/** Overrides the meta description. ~155 characters. */
		metaDescription: z.string().optional(),
		/** What this piece is about, for our own reference and internal linking. */
		keywords: z.array(z.string()).optional(),
		/** What the hero image shows, for screen readers and image search. */
		heroAlt: z.string().optional(),
		/** Set only when this piece was first published somewhere else. */
		canonical: z.string().url().optional(),
	}),
});

const portfolio = defineCollection({
	schema: z.object({
		title: z.string(),
		client: z.string(),
		description: z.string(),
		date: z.string(),
		whatWeDid: z.string().array(),
		clientLogo: z.string(),
		previewImage: z.string(),
	}),
});

export const collections = { blog, portfolio };
