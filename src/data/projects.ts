// Real client work — powers the Portfolio index and the /work/<slug> case
// studies. Screenshots of the live sites live in /public/images/portfolio.
export type ProjectSector = 'agri' | 'health' | 'property' | 'media' | 'commerce' | 'product';

export interface MediaSlot {
	kind: 'image' | 'video';
	src?: string; // when present, a real asset; otherwise a placeholder slot
	label: string;
	caption?: string;
}

export interface PressItem {
	outlet: string;
	title: string;
	date?: string;
	url?: string; // when present, links out; otherwise a "coming" slot
}

export interface CaseStudy {
	intro: string; // the opening story
	challenge: string;
	approach: { title: string; desc: string }[]; // what we did — explained
	highlights: { title: string; desc: string }[]; // solution feature blocks
	results: { stat: string; label: string }[]; // impact numbers
	quote?: { text: string; who: string };
	gallery: MediaSlot[]; // a mix of real shots + slots for pics/video
	services: string[]; // the disciplines we brought
	meta: { client: string; sector: string; year: string; scope: string };
	liveUrl?: string;
	extraLinks?: { label: string; url: string }[];
	press?: { intro?: string; items: PressItem[] }; // news coverage / recognition
}

export interface Project {
	slug: string;
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
	featured?: boolean; // gets a big showcase + a /work/<slug> page
	kind?: 'web' | 'app'; // 'app' shows a clean mockup, no browser chrome
	caseStudy?: CaseStudy;
}

export const sectorLabels: Record<ProjectSector | 'all', string> = {
	all: 'All work',
	agri: 'Agri & Energy',
	health: 'Health & Wellness',
	property: 'Property & Build',
	media: 'Media & Publishing',
	commerce: 'Commerce & Brands',
	product: 'Platforms & Apps',
};

export const sectorOrder: ProjectSector[] = ['agri', 'health', 'property', 'media', 'commerce', 'product'];

export const projects: Project[] = [
	{
		slug: 'hemam-synergy',
		name: 'Hemam Synergy',
		tagline: 'The site behind an ~€850,000 funding win.',
		blurb:
			'An agritech outfit empowering rural smallholder farmers — and a digital presence credible enough to help unlock major grant funding.',
		img: '/images/portfolio/shot-hemamsynergy.jpg',
		url: 'https://hemamsynergy.com/',
		host: 'hemamsynergy.com',
		sector: 'agri',
		tags: ['Website', 'Branding', 'Hosting'],
		color: '#2f9e44',
		year: '2023',
		featured: true,
		caseStudy: {
			meta: { client: 'Hemam Synergy', sector: 'Agritech · Food security', year: '2023', scope: 'Brand · Website · Content · Hosting · Maintenance' },
			liveUrl: 'https://hemamsynergy.com/',
			intro:
				'Hemam Synergy set out to do something hard and important: lift rural smallholder farmers across Nigeria with quality inputs, training, market linkages and solar-powered grain infrastructure. We were part of the team that made the digital side of that ambition real — and the result helped open a very big door, with the organisation going on to secure roughly €850,000 in funding.',
			challenge:
				'To win partners and serious funding, Hemam had to look as credible online as the work was on the ground. The brief was unforgiving: communicate scale, climate-resilience and measurable impact to international funders and agro-industrial partners — clearly, quickly, and without a single weak page or a moment of doubt about who they are.',
			approach: [
				{ title: 'Stakeholder discovery & positioning', desc: 'We sat with the team and mapped exactly what each audience needed to believe — funders need scale and governance; partners need reliability; farmers need trust. Every page got a job.' },
				{ title: 'A serious-operator brand system', desc: 'A clean, earth-toned identity — type, colour, photography rules and components — that reads "established agribusiness", not "startup deck". Confidence in every pixel.' },
				{ title: 'Impact-first information architecture', desc: 'We structured the whole site the way a reviewer reads a proposal: the problem, the scale, the infrastructure, the partners, then the proof. Nothing buried, nothing wasted.' },
				{ title: 'Funding-grade content & copy', desc: 'We wrote and shaped the story around the numbers that matter — warehouse capacity, programmes, reach — so a stakeholder skimming for two minutes still leaves convinced.' },
				{ title: 'Engineering, speed & accessibility', desc: 'Built mobile-first and tuned to load fast on weak rural connections, accessible and crawlable, so it performs for a farmer on 3G and a funder in Berlin alike.' },
				{ title: 'Hardened hosting & ongoing care', desc: 'Secure hosting, monitoring, backups and continuous maintenance — so the day a funder clicks the link, it never blinks, never breaks, never embarrasses.' },
			],
			highlights: [
				{ title: 'Built to be believed', desc: 'Warehouse capacity, programmes and partner logos sit front and centre — the page earns trust before it ever asks for anything.' },
				{ title: 'Funding-grade storytelling', desc: 'The narrative is sequenced the way reviewers actually read: problem → scale → traction → ask. It does the persuading for you.' },
				{ title: 'Field-first, always on', desc: 'Fast on poor connections, accessible, and monitored around the clock — credible to a global funder and usable in the field.' },
			],
			results: [
				{ stat: '~€850K', label: 'in funding the organisation went on to secure' },
				{ stat: '150,000 MT', label: 'warehouse capacity showcased' },
				{ stat: '99.9%', label: 'uptime since launch' },
			],
			quote: { text: 'The site did exactly what we needed — it made serious people take us seriously.', who: 'Hemam Synergy team' },
			services: ['Brand & design', 'Web development', 'Content & copy', 'Hosting & maintenance'],
			press: {
				intro: 'The work landed where it mattered. Hemam’s push went on to attract roughly €850,000 in funding and real press attention — here’s the coverage (drop the live links and clippings in here).',
				items: [
					{ outlet: 'Funding announcement', title: '~€850,000 secured to scale Hemam’s farmer programmes', date: '2023' },
					{ outlet: 'Newspaper feature', title: 'Print coverage of the raise & the impact story', date: '2023' },
					{ outlet: 'Broadcast / interview', title: 'Video feature — the team on the mission', date: '2023' },
				],
			},
			gallery: [
				{ kind: 'video', label: 'Field & impact reel', caption: 'Add a 60–90s film of the work on the ground.' },
				{ kind: 'image', src: '/images/portfolio/shot-hemamsynergy.jpg', label: 'Homepage', caption: 'The landing experience funders see first.' },
				{ kind: 'image', label: 'Programmes & impact', caption: 'Drop in a section shot.' },
				{ kind: 'image', label: 'Infrastructure', caption: 'Warehouse / solar grain shots.' },
				{ kind: 'image', label: 'Partners & proof', caption: 'Partner logos / metrics section.' },
			],
		},
	},
	{
		slug: 'anchorstep',
		name: 'AnchorStep Physiotherapy',
		tagline: 'From zero to a booking brand — across every platform.',
		blurb:
			'A home-based physiotherapy practice in Abuja we grew from nothing into a recognisable, bookable brand on the web and beyond.',
		img: '/images/portfolio/shot-anchorstep.jpg',
		url: 'https://anchorsteppt.com/',
		host: 'anchorsteppt.com',
		sector: 'health',
		tags: ['Website', 'Branding', 'Growth'],
		color: '#2f8f6a',
		year: '2025',
		featured: true,
		caseStudy: {
			meta: { client: 'AnchorStep Physiotherapy', sector: 'Health & wellness · Physiotherapy', year: '2025', scope: 'Brand · Booking site · Multi-platform growth' },
			liveUrl: 'https://anchorsteppt.com/',
			intro:
				'AnchorStep delivers expert, evidence-based physiotherapy — musculoskeletal, neurological, paediatric and therapeutic massage — in patients’ own homes across Abuja. When they came to us, none of that existed online. We took the brand from a blank page to a presence people find, trust and book.',
			challenge:
				'A brand-new clinical practice with no digital footprint and no recognition. It needed to feel established and safe on day one, make booking effortless, and grow an audience from absolute zero — not just a website, but momentum.',
			approach: [
				{ title: 'A calm clinical brand', desc: 'An identity that signals expertise and warmth in the same breath — the kind that makes a brand-new practice feel safe and established.' },
				{ title: 'A booking-first website', desc: 'Appointments scheduled in a couple of taps, with live chat — every visitor is one short step from becoming a patient.' },
				{ title: 'Clear service architecture', desc: 'Musculoskeletal, neuro, paediatric, massage — structured so every condition finds its treatment fast, with zero confusion.' },
				{ title: 'A multi-platform growth engine', desc: 'Web plus a steady social presence, growing together — we built the audience from absolute zero, not just a launch.' },
			],
			highlights: [
				{ title: 'Book in two taps', desc: 'An appointment form and live chat that turn a visitor into a patient without friction.' },
				{ title: 'Trust on first glance', desc: 'Evidence-based copy and a considered brand that make a new practice feel safe and established.' },
				{ title: 'Growth, not just a launch', desc: 'We grew this across multiple platforms — the website is one piece of a wider, compounding presence.' },
			],
			results: [
				{ stat: '0 → live', label: 'from nothing to a booking brand' },
				{ stat: 'Multi-platform', label: 'web + social, growing together' },
				{ stat: 'Same-week', label: 'appointments, booked online' },
			],
			quote: { text: 'They didn’t just build a website — they built our presence and our audience from scratch.', who: 'AnchorStep Physiotherapy' },
			services: ['Brand & design', 'Web development', 'Marketing & growth', 'Maintenance'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-anchorstep.jpg', label: 'Homepage & booking', caption: 'Book-an-appointment, front and centre.' },
				{ kind: 'image', label: 'Services & treatments', caption: 'Drop in a services shot.' },
				{ kind: 'image', label: 'Social / Instagram', caption: 'Add the social grid we grew.' },
				{ kind: 'video', label: 'Brand reel', caption: 'Add a short brand or clinic reel.' },
			],
			extraLinks: [{ label: 'Instagram', url: 'https://www.instagram.com/anchorsteppt' }],
		},
	},
	{
		slug: 'binas-residence',
		name: 'Binas Residence',
		tagline: 'A luxury residence, booked online.',
		blurb:
			'A premium Abuja residence given a calm, upscale brand and a site that turns browsers into reservations.',
		img: '/images/portfolio/shot-binasresidence.jpg',
		url: 'https://binasresidence.com/',
		host: 'binasresidence.com',
		sector: 'property',
		tags: ['Website', 'Branding', 'Hospitality'],
		color: '#c08a3e',
		year: '2024',
		featured: true,
		caseStudy: {
			meta: { client: 'Binas Residence', sector: 'Hospitality · Luxury stays', year: '2024', scope: 'Brand · Website · Reservations' },
			liveUrl: 'https://binasresidence.com/',
			intro:
				'Binas Residence is a premium residential hotel in Abuja — suites, a restaurant, a pool bar and the kind of anticipatory service that turns a stay into a memory. Our job was to make the website feel as considered as the property itself.',
			challenge:
				'Luxury hospitality lives or dies on first impressions. The site had to feel calm, expensive and effortless — and quietly do the commercial work of turning a curious visitor into a booked guest.',
			approach: [
				{ title: 'A restrained, editorial brand', desc: 'Warm neutrals, generous white space and confident type — a brand that feels expensive and calm without ever shouting.' },
				{ title: 'Room-and-suite architecture', desc: 'Structured to sell the experience, not just the nightly rate — every suite gets the staging it deserves.' },
				{ title: 'Reservations where intent peaks', desc: 'Booking and enquiry calls-to-action placed at exactly the moments a guest decides — present, never pushy.' },
				{ title: 'Photography-led layouts', desc: 'Full-bleed imagery and quiet typography that step back and let the property do the talking.' },
			],
			highlights: [
				{ title: 'Quietly upscale', desc: 'Every detail says premium without shouting — the brand does the selling.' },
				{ title: 'Made to book', desc: 'Reservation calls-to-action sit at every decision point, never in the way.' },
				{ title: 'Photography first', desc: 'Full-bleed imagery that makes the suites and spaces the hero.' },
			],
			results: [
				{ stat: '24/7', label: 'reservations, online' },
				{ stat: 'Suite-led', label: 'merchandising that sells the stay' },
				{ stat: '5★', label: 'brand feel, end to end' },
			],
			services: ['Brand & design', 'Web development', 'Maintenance'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-binasresidence.jpg', label: 'Homepage', caption: 'The first impression.' },
				{ kind: 'image', label: 'Rooms & suites', caption: 'Drop in a suites shot.' },
				{ kind: 'video', label: 'Property tour', caption: 'Add a walkthrough video.' },
			],
		},
	},
	{
		slug: 'jobblander',
		name: 'JobbLander',
		tagline: 'Job Application as a Service — AI-enhanced, human-perfected.',
		blurb:
			'A career-acceleration platform (JaaS) that pairs AI with human expertise to optimise CVs, LinkedIn and ATS — and land the interview.',
		img: '/images/portfolio/shot-jobblander.jpg',
		url: 'https://jobblander.com/',
		host: 'jobblander.com',
		sector: 'product',
		tags: ['Product', 'AI', 'Web app'],
		color: '#6366f1',
		year: '2025',
		featured: true,
		caseStudy: {
			meta: { client: 'JobbLander', sector: 'Careers · Job Application as a Service (JaaS)', year: '2025', scope: 'Product · Brand · Web app' },
			liveUrl: 'https://jobblander.com/',
			intro:
				'JobbLander is a premium, end-to-end career service — JaaS, Job Application as a Service — that bridges technology and the human touch. It uses AI to read patterns and optimise for ATS algorithms, then has real professionals refine the CV, LinkedIn profile and career strategy so the story is authentic, sharp and designed to land the interview.',
			challenge:
				'"AI for your career" is a crowded, sceptical space. JobbLander needed to feel premium and trustworthy — clearly more than a résumé generator — and make a layered, human-plus-AI service feel simple and worth paying for.',
			approach: [
				{ title: 'Positioned as JaaS', desc: 'We framed the product as Job Application as a Service — strategic career advancement, not another CV template — and built the whole story around that.' },
				{ title: 'A premium, trustworthy brand', desc: 'An identity and site that sell the human-plus-AI difference and justify a premium price — "serious career partner", not gimmick.' },
				{ title: 'A clear path to interview-ready', desc: 'Service tiers and a guided journey from upload to CV, LinkedIn and strategy — every step legible and easy to commit to.' },
				{ title: 'Trust, engineered in', desc: 'A product experience tuned to feel safe and credible at every step, because that is what makes someone pay for their career.' },
			],
			highlights: [
				{ title: 'AI, then humans', desc: 'AI optimises for ATS; real experts make the story authentic — and we made that promise legible.' },
				{ title: 'Premium, not generic', desc: 'A brand that justifies a premium price and signals "serious career partner".' },
				{ title: 'From upload to interview', desc: 'A guided journey across CV, LinkedIn and strategy, end to end.' },
			],
			results: [
				{ stat: 'JaaS', label: 'a category-defining positioning' },
				{ stat: 'AI + human', label: 'optimisation, in one product' },
				{ stat: 'ATS-tuned', label: 'built to pass the filters' },
			],
			services: ['Product strategy', 'Brand & design', 'Web development', 'AI & automation'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-jobblander.jpg', label: 'Homepage', caption: 'The pitch, in one scroll.' },
				{ kind: 'image', label: 'Product / dashboard', caption: 'Drop in a product shot.' },
				{ kind: 'video', label: 'Product demo', caption: 'Add a short product demo.' },
			],
		},
	},
	{
		slug: 'african-energy',
		name: 'African Energy Advocacy Initiative',
		tagline: 'Energy, oil & gas and consultancy — with a conscience.',
		blurb:
			'A mission-driven platform for clean-energy advocacy and energy consultancy — solar lighting and efficient cookstoves for vulnerable communities.',
		img: '/images/portfolio/shot-africaneai.jpg',
		url: 'https://africaneai.org/',
		host: 'africaneai.org',
		sector: 'agri',
		tags: ['Website', 'Energy', 'Consultancy'],
		color: '#10b981',
		year: '2024',
		featured: true,
		caseStudy: {
			meta: { client: 'African Energy Advocacy Initiative', sector: 'Energy · Oil & gas · Consultancy', year: '2024', scope: 'Brand · Website · Content' },
			liveUrl: 'https://africaneai.org/',
			intro:
				'The African Energy Advocacy Initiative works across the energy spectrum — advocacy, consultancy and on-the-ground clean-energy projects like solar lighting and efficient cookstoves that improve safety, health and livelihoods for vulnerable communities.',
			challenge:
				'An organisation spanning policy advocacy, energy and oil-and-gas consultancy, and grassroots clean-energy work needed one home that holds all of it together — credible to institutions, warm to communities, and clear about impact.',
			approach: [
				{ title: 'A vision-led narrative', desc: 'We found the thread that unifies advocacy, energy & oil-and-gas consultancy and grassroots clean-energy projects — one story, told with conviction.' },
				{ title: 'A clean, optimistic brand', desc: 'An identity built around clean energy that reads credible to institutions and hopeful to the communities being served.' },
				{ title: 'Impact, structured to be read', desc: 'Programmes and metrics organised for two audiences at once — funders skimming for rigour and the public looking for hope.' },
				{ title: 'A content system that lasts', desc: 'Built so the team can keep advocacy, projects and news current without coming back to us for every change.' },
			],
			highlights: [
				{ title: 'One home, many missions', desc: 'Advocacy, consultancy and clean-energy projects, coherently under one roof.' },
				{ title: 'Credible and hopeful', desc: 'A brand that reads serious to institutions and warm to the communities served.' },
				{ title: 'Impact, made visible', desc: 'Programmes and outcomes structured to be understood at a glance.' },
			],
			results: [
				{ stat: 'Multi-mission', label: 'advocacy + consultancy + projects' },
				{ stat: 'Clean energy', label: 'solar lighting & cookstoves' },
				{ stat: 'Community-first', label: 'built for the people served' },
			],
			services: ['Brand & design', 'Web development', 'Content'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-africaneai.jpg', label: 'Homepage', caption: 'Transforming lives through clean energy.' },
				{ kind: 'image', label: 'Programmes', caption: 'Drop in a programmes shot.' },
				{ kind: 'video', label: 'Impact film', caption: 'Add a field/impact film.' },
			],
		},
	},
	{
		slug: 'tellasport',
		name: 'TellaSport',
		tagline: 'The wait is over — bet-code conversion, done.',
		blurb:
			'A sports platform (formerly Betslipswitch) that converts bet codes across bookmakers, with livescores, predictions and a community — on web and mobile.',
		img: '/images/portfolio/betslipswitch.jpg',
		url: null,
		host: 'TellaSport',
		sector: 'product',
		tags: ['Mobile app', 'Web app', 'Sports'],
		color: '#1f9d55',
		year: '2024',
		featured: true,
		kind: 'web',
		caseStudy: {
			meta: { client: 'TellaSport (Betslipswitch)', sector: 'Sports tech · Consumer app', year: '2024', scope: 'Product · Web + mobile app · Brand' },
			intro:
				'TellaSport — which grew out of Betslipswitch — is a free platform that converts bet codes across bookmakers in seconds. Beyond the converter it gives users livescores, rated predictions and a community of tipsters and sports fans, on the web and as a native app on the App Store and Play Store.',
			challenge:
				'Take a genuinely useful utility — instant bet-code conversion — and turn it into a product people keep coming back to: fast, free, reliable across platforms, and sticky enough to build a community around.',
			approach: [
				{ title: 'A converter that just works', desc: 'Sportybet to Nairabet and back in seconds — the core utility, made flawless and fast, because that is what brings people back.' },
				{ title: 'Reasons to stay', desc: 'Livescores and rated predictions woven in to keep users in the app between bets — a tool that becomes a daily habit.' },
				{ title: 'A community layer', desc: 'Tipsters, chat and shared codes — turning a one-off utility into a product with its own gravity and network effect.' },
				{ title: 'Web + native, shipped & maintained', desc: 'One product across the web and native iOS and Android, launched on both stores and kept running.' },
			],
			highlights: [
				{ title: 'Convert in seconds', desc: 'Transfer bet codes across platforms instantly — the core job, done flawlessly.' },
				{ title: 'A reason to stay', desc: 'Livescores and rated predictions turn a one-off tool into a daily habit.' },
				{ title: 'A community, not just a tool', desc: 'Tipsters, chat and shared codes give the product its own gravity.' },
			],
			results: [
				{ stat: 'Free', label: 'and live on App Store + Play Store' },
				{ stat: 'Web + app', label: 'one product, every screen' },
				{ stat: 'Convert · Predict · Connect', label: 'three jobs in one' },
			],
			services: ['Product strategy', 'Web & mobile development', 'Brand & design', 'Maintenance'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/betslipswitch.jpg', label: 'Platform', caption: 'The bet-code converter.' },
				{ kind: 'image', label: 'App screens', caption: 'Drop in the app store screens.' },
				{ kind: 'video', label: 'App promo', caption: 'Add the "We are live" promo.' },
			],
		},
	},
	{
		slug: 'afribarn-links',
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
	},
	{
		slug: 'skaldon-group',
		name: 'Skaldon Group',
		tagline: 'Quality constructions, and more.',
		blurb:
			'A landmark-grade site for a construction and engineering firm — end-to-end projects, dependable teams and quality you can see.',
		img: '/images/portfolio/shot-skaldongroup.jpg',
		url: 'https://skaldongroup.netlify.app/',
		host: 'skaldongroup.netlify.app',
		sector: 'property',
		tags: ['Website', 'Branding', 'Construction'],
		color: '#ef4444',
		year: '2025',
	},
	{
		slug: 'skaldon-erp',
		name: 'Skaldon WatchTower ERP',
		tagline: 'Precision infrastructure management.',
		blurb:
			'A custom operations hub for a construction group — projects, inventory, suppliers, procurement and roles in one secured, real-time dashboard.',
		img: '/images/portfolio/shot-skaldonerp.jpg',
		url: 'https://skaldongrouperp.netlify.app/',
		host: 'skaldongrouperp.netlify.app',
		sector: 'product',
		tags: ['Web app', 'ERP', 'Dashboard'],
		color: '#e0556b',
		year: '2026',
	},
	{
		slug: 'presidential-diary',
		name: 'The Presidential Diary',
		tagline: 'Governance and national affairs, daily.',
		blurb:
			'A fast, content-rich news platform covering politics, business, energy and public policy across Nigeria.',
		img: '/images/portfolio/shot-presidentialdiary.jpg',
		url: 'https://thepresidentialdiary.com.ng/',
		host: 'thepresidentialdiary.com.ng',
		sector: 'media',
		tags: ['Website', 'CMS', 'Publishing'],
		color: '#1f8f4e',
		year: '2025',
	},
	{
		slug: 'younique-magazine',
		name: 'Younique Magazine',
		tagline: 'Inspiration, news, culture, entertainment.',
		blurb:
			'A bold digital magazine — hard news, crime watch, lifestyle and culture, built to publish fast and read beautifully.',
		img: '/images/portfolio/shot-youniquemag.jpg',
		url: 'https://youniquemagazine.com.ng/',
		host: 'youniquemagazine.com.ng',
		sector: 'media',
		tags: ['Website', 'CMS', 'Publishing'],
		color: '#e23b3b',
		year: '2025',
	},
	{
		slug: 'trueverdict',
		name: 'TrueVerdict',
		tagline: 'Independent journalism, online.',
		blurb:
			'A fast, content-heavy news platform for an independent Nigerian publication — politics, business and investigative reporting.',
		img: '/images/portfolio/shot-trueverdict.jpg',
		url: 'https://trueverdict.com.ng/',
		host: 'trueverdict.com.ng',
		sector: 'media',
		tags: ['Website', 'CMS', 'Publishing'],
		color: '#e0556b',
		year: '2023',
	},
	{
		slug: 'jgf-news',
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
		slug: 'brixmarket',
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
		slug: 'my-eya-estate',
		name: 'My Eya Estate',
		tagline: 'Property, presented beautifully.',
		blurb: 'A clean, trustworthy estate website — listings and enquiries that turn browsers into buyers.',
		img: '/images/portfolio/my%20eya%20estate.jpg',
		url: null,
		host: 'myeyaestate',
		sector: 'property',
		tags: ['Website', 'Maintenance'],
		color: '#8b5cf6',
		year: '2023',
	},
	{
		slug: 'appman',
		name: 'AppMan',
		tagline: 'School management, in the palm of your hand.',
		blurb:
			'A school-management platform — attendance via QR smart-IDs, computer-based testing and a parent/student portal, on web and mobile.',
		img: '/images/portfolio/shot-appman.jpg',
		url: null,
		host: 'AppMan',
		sector: 'product',
		tags: ['Mobile app', 'Web app', 'EdTech'],
		color: '#2bb3c0',
		year: '2022',
		kind: 'app',
	},
	{
		slug: 'buygas',
		name: 'BuyGas',
		tagline: 'Cooking gas, delivered.',
		blurb:
			'A platform-as-a-service connecting gas merchants to customers — easy, affordable cooking-gas ordering and delivery, tracked from tap to doorstep.',
		img: '/images/portfolio/shot-buygas.jpg',
		url: null,
		host: 'BuyGas',
		sector: 'product',
		tags: ['Mobile app', 'Delivery', 'PaaS'],
		color: '#22c55e',
		year: '2023',
		kind: 'app',
	},
	{
		slug: 'beauty-hive',
		name: 'Beauty Hive',
		tagline: 'Beauty commerce that converts.',
		blurb: 'A beauty storefront built to sell — product merchandising, a smooth checkout and a brand that pops.',
		img: '/images/portfolio/beauty-hive.webp',
		url: null,
		host: 'beautyhive',
		sector: 'commerce',
		tags: ['E-commerce', 'Branding'],
		color: '#ec4899',
		year: '2023',
	},
	{
		slug: 'purple-panda',
		name: 'Purple Panda',
		tagline: 'A brand with a pulse.',
		blurb: 'Brand and web for a marketing-led product — distinctive identity and a site tuned for growth and SEO.',
		img: '/images/portfolio/purplepanda%20world.jpg',
		url: null,
		host: 'purplepanda',
		sector: 'commerce',
		tags: ['Branding', 'SEO', 'Website'],
		color: '#a855f7',
		year: '2022',
	},
	{
		slug: 'saros',
		name: 'Saros',
		tagline: 'Learning, made simple.',
		blurb: 'An education platform designed around the people who use it — clear, calm and dependable.',
		img: '/images/portfolio/sarosgp.jpg',
		url: null,
		host: 'sarosgp',
		sector: 'product',
		tags: ['Website', 'Maintenance'],
		color: '#14b8a6',
		year: '2023',
	},
];

export const featuredProjects = projects.filter((p) => p.caseStudy);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
