// What every world's version of /services/<slug> shares. See work.ts.
import { disciplines } from '../../data/disciplines';
import { DISCIPLINE_SEO, snippet } from '../../data/seo';
import { graph, service, faqPage } from '../../data/schema';

export type Discipline = (typeof disciplines)[number];

export function servicePaths() {
	return disciplines.map((d) => ({
		params: { slug: d.slug },
		props: { discipline: d, others: disciplines.filter((x) => x.slug !== d.slug) },
	}));
}

export function serviceSeo(discipline: Discipline) {
	const d = DISCIPLINE_SEO[discipline.slug];
	const pageTitle = d ? d.title : `${discipline.title} | Swizel`;
	const written = [discipline.heroDesc, discipline.overview].filter(Boolean).join(' ');
	const pageDescription = snippet(
		written.length < 120
			? `${written.replace(/\s*$/, '')} For businesses in Nigeria, the UK, the US and across the EU.`
			: written
	);
	const pageSchema = graph(
		service({
			name: discipline.title,
			description: discipline.overview || discipline.heroDesc,
			path: `/services/${discipline.slug}`,
			serviceType: discipline.title,
			offers: discipline.included?.map((s) => ({ name: s.title, description: s.desc })),
		}),
		discipline.faqs?.length ? faqPage(discipline.faqs, `/services/${discipline.slug}`) : null
	);
	return { pageTitle, pageDescription, pageSchema };
}
