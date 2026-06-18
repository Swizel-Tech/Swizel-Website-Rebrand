// Real client work — used by the Portfolio page. Screenshots of the live sites
// live in /public/images/portfolio. `sector` keys drive the filter chips.
export type ProjectSector = 'agri' | 'media' | 'property' | 'commerce' | 'product';

export interface Project {
	name: string;
	tagline: string;
	blurb: string;
	img: string;
	url: string | null;
	host: string; // shown in the little browser bar
	sector: ProjectSector;
	tags: string[];
	color: string;
	year: string;
	featured?: boolean;
}

export const sectorLabels: Record<ProjectSector | 'all', string> = {
	all: 'All work',
	agri: 'Agri & Energy',
	media: 'Media & Publishing',
	property: 'Property & Stays',
	commerce: 'Commerce & Brands',
	product: 'Platforms & Apps',
};

export const projects: Project[] = [
	{
		name: 'Binas Residence',
		tagline: 'A luxury residence, booked online.',
		blurb:
			'A polished site for a premium Abuja residence — suites, amenities, dining and reservations, wrapped in a calm, upscale brand.',
		img: '/images/portfolio/shot-binasresidence.jpg',
		url: 'https://binasresidence.com/',
		host: 'binasresidence.com',
		sector: 'property',
		tags: ['Website', 'Branding', 'Hospitality'],
		color: '#c08a3e',
		year: '2024',
		featured: true,
	},
	{
		name: 'Afribarn Links',
		tagline: 'Powering agriculture, energizing communities.',
		blurb:
			'A bold site for an agritech and clean-energy company — farmer empowerment, solar integration and agribusiness advisory across sub-Saharan Africa.',
		img: '/images/portfolio/shot-afribarnlinks.jpg',
		url: 'https://afribarnlinks.com/',
		host: 'afribarnlinks.com',
		sector: 'agri',
		tags: ['Website', 'Branding', 'Maintenance'],
		color: '#22a45d',
		year: '2024',
		featured: true,
	},
	{
		name: 'JobbLander',
		tagline: 'AI-enhanced, human-perfected careers.',
		blurb:
			'A career platform that blends technology with the human touch — AI-tuned CVs, LinkedIn and ATS optimisation built to land the interview.',
		img: '/images/portfolio/shot-jobblander.jpg',
		url: 'https://jobblander.com/',
		host: 'jobblander.com',
		sector: 'product',
		tags: ['Product', 'AI', 'Web app'],
		color: '#6366f1',
		year: '2025',
		featured: true,
	},
	{
		name: 'Hemam Synergy',
		tagline: 'Feeding the future, farmer by farmer.',
		blurb:
			'A credibility-first site for an agritech outfit empowering rural smallholder farmers — inputs, training, market linkages and solar-powered grain infrastructure.',
		img: '/images/portfolio/shot-hemamsynergy.jpg',
		url: 'https://hemamsynergy.com/',
		host: 'hemamsynergy.com',
		sector: 'agri',
		tags: ['Website', 'Branding', 'Hosting'],
		color: '#2f9e44',
		year: '2023',
	},
	{
		name: 'African Energy Advocacy Initiative',
		tagline: 'Transforming lives through clean energy.',
		blurb:
			'A mission-driven nonprofit site — solar lighting and efficient cookstoves that improve safety, health and livelihoods for vulnerable communities.',
		img: '/images/portfolio/shot-africaneai.jpg',
		url: 'https://africaneai.org/',
		host: 'africaneai.org',
		sector: 'agri',
		tags: ['Website', 'Nonprofit'],
		color: '#10b981',
		year: '2024',
	},
	{
		name: 'TrueVerdict',
		tagline: 'Independent journalism, online.',
		blurb:
			'A fast, content-heavy news platform for an independent Nigerian publication — politics, business and investigative reporting, easy to publish and read.',
		img: '/images/portfolio/shot-trueverdict.jpg',
		url: 'https://trueverdict.com.ng/',
		host: 'trueverdict.com.ng',
		sector: 'media',
		tags: ['Website', 'CMS', 'Publishing'],
		color: '#e0556b',
		year: '2023',
	},
	{
		name: 'Journalists Global Foundation',
		tagline: 'Amplifying the people who report the world.',
		blurb:
			'A newsroom-style platform for a nonprofit that champions journalists — flash stories, editor’s picks and deep category coverage.',
		img: '/images/portfolio/shot-jgfnews.jpg',
		url: 'https://jgfnews.com.ng/',
		host: 'jgfnews.com.ng',
		sector: 'media',
		tags: ['Website', 'CMS', 'Publishing'],
		color: '#2f8f4e',
		year: '2024',
	},
	{
		name: 'Brixmarket',
		tagline: 'A marketplace for real estate.',
		blurb:
			'A property marketplace connecting buyers, sellers and agents — search, listings and the tooling to keep deals moving.',
		img: '/images/portfolio/brix%20marketplace.jpg',
		url: null,
		host: 'brixmarket',
		sector: 'property',
		tags: ['Web app', 'Marketing', 'Maintenance'],
		color: '#3b82f6',
		year: '2022',
	},
	{
		name: 'My Eya Estate',
		tagline: 'Property, presented beautifully.',
		blurb:
			'A clean, trustworthy estate website — listings and enquiries that turn browsers into buyers.',
		img: '/images/portfolio/my%20eya%20estate.jpg',
		url: null,
		host: 'myeyaestate',
		sector: 'property',
		tags: ['Website', 'Maintenance'],
		color: '#8b5cf6',
		year: '2023',
	},
	{
		name: 'Beauty Hive',
		tagline: 'Beauty commerce that converts.',
		blurb:
			'A beauty storefront built to sell — product merchandising, a smooth checkout and a brand that pops.',
		img: '/images/portfolio/beauty-hive.webp',
		url: null,
		host: 'beautyhive',
		sector: 'commerce',
		tags: ['E-commerce', 'Branding'],
		color: '#ec4899',
		year: '2023',
	},
	{
		name: 'Purple Panda',
		tagline: 'A brand with a pulse.',
		blurb:
			'Brand and web for a marketing-led product — distinctive identity and a site tuned for growth and SEO.',
		img: '/images/portfolio/purplepanda%20world.jpg',
		url: null,
		host: 'purplepanda',
		sector: 'commerce',
		tags: ['Branding', 'SEO', 'Website'],
		color: '#a855f7',
		year: '2022',
	},
	{
		name: 'Betslipswitch',
		tagline: 'A sports platform that never blinks.',
		blurb:
			'A high-traffic sports product engineered to stay fast and reliable on its busiest days.',
		img: '/images/portfolio/betslipswitch.jpg',
		url: null,
		host: 'betslipswitch',
		sector: 'product',
		tags: ['Web app', 'Marketing', 'Maintenance'],
		color: '#0ea5e9',
		year: '2022',
	},
	{
		name: 'Saros',
		tagline: 'Learning, made simple.',
		blurb:
			'An education platform designed around the people who use it — clear, calm and dependable.',
		img: '/images/portfolio/sarosgp.jpg',
		url: null,
		host: 'sarosgp',
		sector: 'product',
		tags: ['Website', 'Maintenance'],
		color: '#14b8a6',
		year: '2023',
	},
];
