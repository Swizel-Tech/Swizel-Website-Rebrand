// Structured data, built rather than typed.
//
// MainLayout takes one `schema` object per page, so where a page needs
// several records — a Service, a question list, a breadcrumb — they go in
// one @graph. Written by hand that is a lot of braces to get wrong
// silently: a malformed block is not an error, it is simply ignored, so
// you find out months later that none of it ever counted.

export const ORG = 'https://www.swizel.co/#organization';
export const SITE = 'https://www.swizel.co';

/** Named places beat "worldwide": a search can be matched against a city. */
export const AREA_SERVED = [
	{ '@type': 'City', name: 'Abuja' },
	{ '@type': 'City', name: 'Lagos' },
	{ '@type': 'City', name: 'Port Harcourt' },
	{ '@type': 'Country', name: 'Nigeria' },
	{ '@type': 'Place', name: 'Africa' },
	{ '@type': 'Country', name: 'United Kingdom' },
	{ '@type': 'Country', name: 'Ireland' },
	{ '@type': 'Country', name: 'United States' },
	{ '@type': 'Place', name: 'European Union' },
];

/** Just the places, for a page whose subject is Nigeria and Africa. */
export const AREA_AFRICA = [
	{ '@type': 'City', name: 'Abuja' },
	{ '@type': 'City', name: 'Lagos' },
	{ '@type': 'City', name: 'Port Harcourt' },
	{ '@type': 'City', name: 'Kano' },
	{ '@type': 'Country', name: 'Nigeria' },
	{ '@type': 'Country', name: 'Ghana' },
	{ '@type': 'Country', name: 'Kenya' },
	{ '@type': 'Place', name: 'West Africa' },
	{ '@type': 'Place', name: 'Africa' },
];

/** And for the page whose subject is everywhere else. */
export const AREA_GLOBAL = [
	{ '@type': 'Country', name: 'United Kingdom' },
	{ '@type': 'Country', name: 'United States' },
	{ '@type': 'Country', name: 'Ireland' },
	{ '@type': 'Country', name: 'Canada' },
	{ '@type': 'Country', name: 'Germany' },
	{ '@type': 'Country', name: 'Netherlands' },
	{ '@type': 'Country', name: 'Iceland' },
	{ '@type': 'Country', name: 'United Arab Emirates' },
	{ '@type': 'Place', name: 'European Union' },
];

export interface ServiceSchemaInput {
	name: string;
	description: string;
	/** Path, with the leading slash. */
	path: string;
	/** The named sub-services, which become the offer catalogue. */
	offers?: { name: string; description: string }[];
	areaServed?: unknown[];
	serviceType?: string;
}

export function service(input: ServiceSchemaInput) {
	const url = `${SITE}${input.path.replace(/\/?$/, '/')}`;
	const rec: Record<string, unknown> = {
		'@type': 'Service',
		'@id': `${url}#service`,
		name: input.name,
		description: input.description,
		serviceType: input.serviceType ?? input.name,
		url,
		provider: { '@id': ORG },
		areaServed: input.areaServed ?? AREA_SERVED,
		audience: { '@type': 'BusinessAudience', name: 'Businesses and founders' },
	};
	if (input.offers?.length) {
		rec.hasOfferCatalog = {
			'@type': 'OfferCatalog',
			name: input.name,
			itemListElement: input.offers.map((o) => ({
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: o.name,
					description: o.description,
					provider: { '@id': ORG },
				},
			})),
		};
	}
	return rec;
}

/**
 * The question list. Google will draw these under the result when it
 * feels like it, and reads them as a signal of depth even when it does
 * not — but only if the answer is a real answer, so the copy that feeds
 * this is the copy on the page, never a summary of it.
 */
export function faqPage(faqs: { q: string; a: string }[], path: string) {
	const url = `${SITE}${path.replace(/\/?$/, '/')}`;
	return {
		'@type': 'FAQPage',
		'@id': `${url}#faq`,
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: {
				'@type': 'Answer',
				// the answers carry links; schema wants text
				text: f.a.replace(/<[^>]+>/g, ''),
			},
		})),
	};
}

/** A page about a place, rather than about a thing. */
export function localPage(input: {
	name: string;
	description: string;
	path: string;
	areaServed: unknown[];
	/** The offices this page speaks for. */
	locations?: {
		name: string;
		street?: string;
		city: string;
		region?: string;
		postalCode?: string;
		country: string;
		lat?: number;
		lon?: number;
	}[];
}) {
	const url = `${SITE}${input.path.replace(/\/?$/, '/')}`;
	const rec: Record<string, unknown> = {
		'@type': ['WebPage', 'ProfessionalService'],
		'@id': `${url}#page`,
		name: input.name,
		description: input.description,
		url,
		parentOrganization: { '@id': ORG },
		provider: { '@id': ORG },
		areaServed: input.areaServed,
	};
	if (input.locations?.length) {
		rec.location = input.locations.map((l) => ({
			'@type': 'Place',
			name: l.name,
			address: {
				'@type': 'PostalAddress',
				...(l.street ? { streetAddress: l.street } : {}),
				addressLocality: l.city,
				...(l.region ? { addressRegion: l.region } : {}),
				...(l.postalCode ? { postalCode: l.postalCode } : {}),
				addressCountry: l.country,
			},
			...(l.lat && l.lon
				? { geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lon } }
				: {}),
		}));
	}
	return rec;
}

/** Wrap the records for one page into the single object MainLayout takes. */
export function graph(...records: unknown[]) {
	return {
		'@context': 'https://schema.org',
		'@graph': records.filter(Boolean),
	};
}
