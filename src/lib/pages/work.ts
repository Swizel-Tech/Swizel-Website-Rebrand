// What every world's version of /work/<slug> shares: the paths, and the
// title, description and structured data of the case study. The five
// page files under src/pages (one per world) are thin; this is the page.
import { featuredProjects, projects, sectorLabels } from '../../data/projects';
import { snippet } from '../../data/seo';

export type Project = (typeof projects)[number];

export function workPaths() {
	return projects
		.filter((p) => p.caseStudy)
		.map((p) => {
			const others = featuredProjects.filter((o) => o.slug !== p.slug);
			return { params: { slug: p.slug }, props: { project: p, others } };
		});
}

export function workSeo(project: Project) {
	// ── the blue link ──
	// "<Name> <trade> Case Study | Swizel" when it fits, else without the trade.
	const trade = (project.tags || [])[0] || '';
	const plain = `${project.name} Case Study | Swizel`;
	const withTrade = `${project.name} ${trade} Case Study | Swizel`;
	const seoTitle = trade && withTrade.length <= 62 ? withTrade : plain;

	// ── the grey snippet ──
	const lead = (project.tagline || '').replace(/\.$/, '');
	const body = project.blurb || project.caseStudy?.intro || '';
	const trades = (project.tags || []).join(', ').toLowerCase();
	const seoDesc = snippet(
		[lead, body, trades && `${trades} by Swizel Technologies.`]
			.filter(Boolean)
			.join(lead && body ? ' — ' : ' ')
			.replace(' — ' + trades, ' ' + trades)
	);

	const caseSchema = {
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		'@id': `https://www.swizel.co/work/${project.slug}/#case-study`,
		name: `${project.name} — case study`,
		headline: `${project.name}: ${lead}`,
		description: seoDesc,
		url: `https://www.swizel.co/work/${project.slug}/`,
		image: `https://www.swizel.co${project.img}`,
		...(project.year ? { dateCreated: String(project.year) } : {}),
		creator: { '@id': 'https://www.swizel.co/#organization' },
		publisher: { '@id': 'https://www.swizel.co/#organization' },
		about: {
			'@type': 'Thing',
			name: project.name,
			description: body,
		},
		keywords: [...(project.tags || []), sectorLabels[project.sector], 'Swizel'].join(', '),
		inLanguage: 'en',
	};

	return { seoTitle, seoDesc, caseSchema };
}
