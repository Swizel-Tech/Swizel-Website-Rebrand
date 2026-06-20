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
