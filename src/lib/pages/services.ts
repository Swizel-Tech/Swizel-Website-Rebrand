// The /services hub: its ItemList schema, shared by every world's version.
import { PAGES } from '../../data/seo';
import { graph, SITE, ORG } from '../../data/schema';

export const servicesSeo = PAGES['/services'];

const SERVICE_LIST: [string, string][] = [
	['Custom software development', '/services/custom-software/'],
	['Web & mobile app development', '/services/app-development/'],
	['Enterprise ERP systems', '/services/erp-systems/'],
	['Web & mobile development', '/services/development/'],
	['UI/UX & product design', '/services/design/'],
	['Digital marketing', '/services/marketing/'],
	['Product strategy & consulting', '/services/strategy/'],
	['Maintenance & support', '/services/maintenance/'],
	['AI & automation', '/services/ai-automation/'],
];

export const servicesSchema = graph({
	'@type': 'ItemList',
	'@id': `${SITE}/services/#list`,
	name: 'Swizel software development services',
	description: servicesSeo.description,
	itemListElement: SERVICE_LIST.map(([name, path], i) => ({
		'@type': 'ListItem',
		position: i + 1,
		name,
		url: `${SITE}${path}`,
		item: {
			'@type': 'Service',
			name,
			url: `${SITE}${path}`,
			provider: { '@id': ORG },
		},
	})),
});
