// Every page's blue link, grey snippet and target phrase, in one file.
//
// Why this exists
// ───────────────
// The tags used to live in each page's frontmatter. That is fine until
// there are thirty-five of them, at which point two pages quietly end up
// chasing the same phrase and beating each other, a description runs to
// 210 characters and gets cut mid-word, and nobody notices for a month.
//
// One file means the whole set can be read at a glance — and it means
// scripts/page-seo-check.mjs has something to check the built HTML
// against rather than only checking it against itself.
//
// The shape of the plan
// ─────────────────────
// The site has three jobs to do in search and they pull in opposite
// directions, so they are given different pages rather than fought over
// on one:
//
//   what we do    → /, /services and the /services/* pages carry the
//                   commercial phrases a stranger types with no place in
//                   them: "custom software development company",
//                   "mobile app development", "ERP software".
//   where we are  → /nigeria and /global carry the places. A page that
//                   names Abuja, Lagos, Nigeria and Africa can win those
//                   searches without the home page having to read like a
//                   directory listing, which is what it had started to do.
//   who we are    → /about, /portfolio, /blog and /contact carry the
//                   brand, the proof and the intent to buy.
//
// Every title is under 60 characters and every description between 120
// and 160, because that is where Google cuts them. The check enforces it.

export const BRAND = 'Swizel';
export const BRAND_FULL = 'Swizel Technologies Limited';

export interface PageSeo {
	/** The blue link. Under 60 characters, keyword first, brand last. */
	title: string;
	/** The grey snippet. 120–160 characters, and it should sell, not describe. */
	description: string;
	/**
	 * The phrase this page is trying to win. Not emitted as a meta tag —
	 * Google has ignored those since 2009 — but recorded so it is obvious
	 * when two pages start competing, and used for the keywords tag Bing
	 * still reads a little.
	 */
	keywords: string[];
	/**
	 * The short line that sits, visible, directly above the H1. On a
	 * design-led site the H1 is a piece of art direction — "You imagine.
	 * We build." — and rewriting it into "Empowering Global Enterprise
	 * with Custom Software Solutions" would buy a keyword and sell the
	 * company's voice to get it. The kicker is the honest trade: real
	 * visible text, in the strongest position on the page short of the
	 * H1 itself, carrying the phrase the title tag is chasing.
	 */
	kicker?: string;
	/** og:image, when the page has one of its own. */
	image?: string;
}

/**
 * The places, written once. Used in copy, in schema and in the regional
 * pages, so the site can never claim a different footprint in two places.
 */
export const REACH = {
	cities: ['Abuja', 'Lagos', 'Cork', 'Sheffield', 'New York'],
	countries: ['Nigeria', 'Ireland', 'United Kingdom', 'United States'],
	regions: ['Africa', 'Europe', 'North America'],
} as const;

export const PAGES: Record<string, PageSeo> = {
	// ── what we do ────────────────────────────────────────────────────
	'/': {
		title: 'Custom Software & App Development Company | Swizel',
		description:
			'We build custom software, web platforms and mobile apps for ambitious businesses — from Nigeria and the UK to the US, EU and beyond. 65+ products shipped.',
		keywords: [
			'custom software development company',
			'app development agency',
			'global software company',
			'software development company Nigeria',
		],
		kicker: 'Custom software development',
	},

	'/services': {
		title: 'Software Development & Engineering Services | Swizel',
		description:
			'End-to-end software development services: web platforms, mobile apps, custom ERP systems, product design and digital marketing for businesses ready to scale.',
		keywords: [
			'software development services',
			'enterprise software services',
			'custom tech solutions',
			'software engineering company',
		],
		kicker: 'What we do',
		image: '/images/og/og-services.jpg',
	},

	'/services/custom-software': {
		title: 'Custom Software Development Services | Swizel',
		description:
			'Bespoke software built around how your business actually works. Secure, scalable platforms for operations, customers and reporting, designed and maintained.',
		keywords: [
			'custom software development',
			'bespoke software agency',
			'enterprise software solutions',
			'custom software development company Nigeria',
		],
		kicker: 'Custom software development',
		image: '/images/og/og-services.jpg',
	},

	'/services/app-development': {
		title: 'Mobile & Web App Development Company | Swizel',
		description:
			'We design and build high-performance iOS and Android apps and responsive web applications — engineered for speed, scale and a seamless user experience.',
		keywords: [
			'mobile app development',
			'web application development',
			'iOS Android app development company',
			'app developers Nigeria',
		],
		kicker: 'Mobile & web app development',
		image: '/images/og/og-services.jpg',
	},

	'/services/erp-systems': {
		title: 'Enterprise ERP Software Development | Swizel',
		description:
			'Custom ERP systems that pull inventory, finance, operations and reporting into one place — built for how your business runs, in Nigeria and internationally.',
		keywords: [
			'enterprise ERP development',
			'custom ERP software',
			'ERP development company',
			'ERP software Nigeria',
		],
		kicker: 'Enterprise ERP systems',
		image: '/images/og/og-services.jpg',
	},

	// ── where we are ──────────────────────────────────────────────────
	'/nigeria': {
		title: 'Software Company in Nigeria — Abuja & Lagos | Swizel',
		description:
			'A software development company in Nigeria building web platforms, mobile apps and ERP systems for businesses in Abuja, Lagos and across Africa since 2019.',
		keywords: [
			'software development company Nigeria',
			'software company Abuja',
			'tech company Lagos',
			'software developers Abuja',
			'app development company Nigeria',
			'software development Africa',
		],
		kicker: 'Nigeria · Abuja, Lagos & across Africa',
	},

	'/global': {
		title: 'Global Software Development Partner | UK, US & EU | Swizel',
		description:
			'A dedicated engineering partner for teams in the UK, US, Ireland and the EU. Custom software, apps and ERP builds, on a working day you actually share.',
		keywords: [
			'global software development partner',
			'software outsourcing UK US',
			'offshore software development company',
			'software development EU',
			'dedicated development team',
		],
		kicker: 'United Kingdom · United States · Ireland · EU',
	},

	// ── who we are ────────────────────────────────────────────────────
	'/about': {
		title: 'About Swizel | Global Software Development Firm',
		description:
			'Designers, engineers, analysts and marketers who have shipped 65+ products across 10+ countries since 2019. Meet the team behind the software, and how we work.',
		keywords: [
			'about Swizel Technologies',
			'software development firm',
			'tech agency story',
			'software company Abuja',
		],
		kicker: 'About Swizel',
		image: '/images/og/og-about.jpg',
	},

	'/contact': {
		title: 'Contact Our Software Development Team | Swizel',
		description:
			'Ready to build a web platform, mobile app or ERP system? Call +234 810 020 4570, write to contact@swizel.co, or send a brief — we reply within one business day.',
		keywords: [
			'hire software developers',
			'contact software company',
			'software development quote',
			'software developers Abuja',
		],
		kicker: 'Talk to us',
		image: '/images/og/og-contact.jpg',
	},

	'/portfolio': {
		title: 'Software Development Portfolio & Case Studies | Swizel',
		description:
			'Web platforms, mobile apps and brands we have shipped across fintech, real estate, sport, education and energy — with the full story behind each build.',
		keywords: [
			'software development portfolio',
			'software case studies',
			'app development portfolio',
			'web development projects Nigeria',
		],
		kicker: 'Portfolio · the receipts',
		image: '/images/og/og-portfolio.jpg',
	},

	'/blog': {
		title: 'Software, Design & Marketing Insights | Swizel Journal',
		description:
			'Build notes and plain-English insight on software, design, AI and digital marketing from the team shipping it — for businesses in Africa, Europe and the US.',
		keywords: [
			'software development blog',
			'technology insights Nigeria',
			'software design articles',
			'AI for business',
		],
		kicker: 'The Swizel journal',
		image: '/images/og/og-blog.jpg',
	},

	'/programs': {
		title: 'Tech Internships & NYSC Placement in Abuja | Swizel',
		description:
			'Internships, NYSC placement and mentorship at a working software company in Abuja. Learn on real client products, beside the team building them.',
		keywords: [
			'tech internship Abuja',
			'NYSC placement IT company',
			'software internship Nigeria',
			'tech mentorship Abuja',
		],
		kicker: 'Internships, NYSC & mentorship',
	},
};

/** The six disciplines, given the phrase a stranger would actually type. */
export const DISCIPLINE_SEO: Record<
	string,
	{ title: string; kicker: string; keywords: string[] }
> = {
	development: {
		title: 'Web & Mobile Development Company | Nigeria, UK & US',
		kicker: 'Web & mobile development',
		keywords: ['web development company', 'mobile app development', 'software developers'],
	},
	design: {
		title: 'UI/UX & Product Design Agency | Nigeria, UK & US',
		kicker: 'UI/UX & product design',
		keywords: ['UI UX design agency', 'product design company', 'brand identity design'],
	},
	marketing: {
		title: 'Digital Marketing Agency | Nigeria, UK & US | Swizel',
		kicker: 'Digital marketing & growth',
		keywords: ['digital marketing agency', 'SEO agency Nigeria', 'paid social agency'],
	},
	strategy: {
		title: 'Product Strategy & Technical Consulting | Swizel',
		kicker: 'Product strategy & consulting',
		keywords: ['product strategy consulting', 'MVP scoping', 'technology consulting'],
	},
	maintenance: {
		title: 'Website & App Maintenance & Support Services | Swizel',
		kicker: 'Maintenance, hosting & support',
		keywords: ['website maintenance services', 'app support and maintenance', 'managed hosting'],
	},
	'ai-automation': {
		title: 'AI & Business Process Automation Services | Swizel',
		kicker: 'AI & automation',
		keywords: ['AI automation services', 'business process automation', 'AI integration company'],
	},
};

/**
 * Cut a piece of page copy down to a usable snippet.
 *
 * Several pages are generated from content written for the page rather
 * than for a search result — a case study's intro, a project's
 * description, a discipline's hero line. Those run anywhere from 21 to
 * 322 characters, and Google uses neither extreme: under about 70 it
 * decides the description is too thin and scrapes the page instead, and
 * over about 160 it cuts, frequently mid-word.
 *
 * So: leave it alone if it fits, cut on a sentence boundary if there is
 * a sensible one, and cut on a word with an ellipsis otherwise. Never
 * mid-word, which is the one thing that looks broken.
 */
export function snippet(text: string, max = 158): string {
	const s = (text || '').replace(/\s+/g, ' ').trim();
	if (s.length <= max) return s;
	const stop = s.lastIndexOf('. ', max);
	if (stop > max * 0.55) return s.slice(0, stop + 1);
	const word = s.lastIndexOf(' ', max - 1);
	return `${s.slice(0, word > 0 ? word : max - 1)}…`;
}

/** Look a page up by path, tolerating a trailing slash. */
export function seoFor(path: string): PageSeo | undefined {
	const clean = path !== '/' ? path.replace(/\/+$/, '') : '/';
	return PAGES[clean];
}
