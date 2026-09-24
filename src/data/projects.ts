// Real client work. Powers the Portfolio index and the /work/<slug> case
// studies. Screenshots of the live sites live in /public/images/portfolio.
export type ProjectSector = 'agri' | 'health' | 'property' | 'media' | 'commerce' | 'product';

export interface MediaSlot {
	kind: 'image' | 'video';
	src?: string; // when present, a real asset; otherwise a placeholder slot
	/**
	 * A YouTube id instead of a hosted file. It plays inside our own player,
	 * which stops dead on its last frame, so nothing of YouTube's is ever
	 * offered after a client's film.
	 */
	youtubeId?: string;
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
	approach: { title: string; desc: string }[]; // what we did, explained
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
			'An agritech outfit empowering rural smallholder farmers, with a digital presence credible enough to help unlock major grant funding.',
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
				'Hemam Synergy set out to do something hard and important: lift rural smallholder farmers across Nigeria with quality inputs, training, market linkages and solar-powered grain infrastructure. We were part of the team that made the digital side of that ambition real, and the result helped open a very big door, with the organisation going on to secure roughly €850,000 in funding.',
			challenge:
				'To win partners and serious funding, Hemam had to look as credible online as the work was on the ground. The brief was unforgiving: communicate scale, climate-resilience and measurable impact to international funders and agro-industrial partners: clearly, quickly, and without a single weak page or a moment of doubt about who they are.',
			approach: [
				{ title: 'Stakeholder discovery & positioning', desc: 'We sat with the team and mapped exactly what each audience needed to believe, funders need scale and governance; partners need reliability; farmers need trust. Every page got a job.' },
				{ title: 'A serious-operator brand system', desc: 'A clean, earth-toned identity, type, colour, photography rules and components, that reads "established agribusiness", not "startup deck". Confidence in every pixel.' },
				{ title: 'Impact-first information architecture', desc: 'We structured the whole site the way a reviewer reads a proposal: the problem, the scale, the infrastructure, the partners, then the proof. Nothing buried, nothing wasted.' },
				{ title: 'Funding-grade content & copy', desc: 'We wrote and shaped the story around the numbers that matter, warehouse capacity, programmes, reach, so a stakeholder skimming for two minutes still leaves convinced.' },
				{ title: 'Engineering, speed & accessibility', desc: 'Built mobile-first and tuned to load fast on weak rural connections, accessible and crawlable, so it performs for a farmer on 3G and a funder in Berlin alike.' },
				{ title: 'Hardened hosting & ongoing care', desc: 'Secure hosting, monitoring, backups and continuous maintenance, so the day a funder clicks the link, it never blinks, never breaks, never embarrasses.' },
			],
			highlights: [
				{ title: 'Built to be believed', desc: 'Warehouse capacity, programmes and partner logos sit front and centre, the page earns trust before it ever asks for anything.' },
				{ title: 'Funding-grade storytelling', desc: 'The narrative is sequenced the way reviewers actually read: problem → scale → traction → ask. It does the persuading for you.' },
				{ title: 'Field-first, always on', desc: 'Fast on poor connections, accessible, and monitored around the clock, credible to a global funder and usable in the field.' },
			],
			results: [
				{ stat: '~€850K', label: 'in funding the organisation went on to secure' },
				{ stat: '150,000 MT', label: 'warehouse capacity showcased' },
				{ stat: '99.9%', label: 'uptime since launch' },
			],
			quote: { text: 'The site did exactly what we needed. It made serious people take us seriously.', who: 'Hemam Synergy team' },
			services: ['Brand & design', 'Web development', 'Content & copy', 'Hosting & maintenance'],
			press: {
				intro: 'The work landed where it mattered. Hemam went on to be selected for major grant funding, around €850,000, and the story was picked up in the press. The coverage:',
				items: [
					{ outlet: 'BusinessDay', title: 'Firm to boost Nigeria’s rice production via €850,000 grant', date: '2024', url: 'https://businessday.ng/news/article/firm-to-boost-nigerias-rice-production-via-e850000-grant/' },
					{ outlet: 'Fund for Youth Employment', title: 'Nigeria selection: Hemam Synergy Ltd', date: '2024', url: 'https://fundforyouthemployment.nl/nigeria-selection-hemam-synergy-ltd/' },
					{ outlet: 'LinkedIn · Video', title: 'Food security and policy: the team on the mission', date: '2024', url: 'https://www.linkedin.com/posts/hemamsynergylimited_foodsecurity-nigeriaagriculture-policymatters-activity-7330954291009966080-eVs1/' },
				],
			},
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-hemamsynergy.jpg', label: 'Homepage', caption: 'The landing experience funders see first.' },
				{ kind: 'image', src: '/images/portfolio/shot-hemam-programmes.jpg', label: 'The solutions', caption: 'Inputs, market access and grain offtake, laid out plainly.' },
				{ kind: 'image', src: '/images/portfolio/shot-hemam-partner.jpg', label: 'Partner with us', caption: 'The invitation funders and agro-partners land on.' },
			],
		},
	},
	{
		slug: 'anchorstep',
		name: 'AnchorStep Physiotherapy',
		tagline: 'From zero to a booking brand, across every platform.',
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
				'AnchorStep Physiotherapy delivers expert, evidence-based physiotherapy across musculoskeletal, neurological, paediatric and therapeutic massage, all in patients’ own homes across Abuja. When they came to us, none of that existed online: no brand, no website, no audience, no recognition. We took AnchorStep from a completely blank page to a presence people can find, trust and book, and then, crucially, we did the harder work of building the audience itself. This was not a one-off website project; it was an ongoing, multi-platform growth effort, and we grew it from absolute zero into a recognisable, bookable brand. The website is the anchor, but the brand now lives and grows across multiple channels, compounding month after month.',
			challenge:
				'A brand-new clinical practice carries a quiet, brutal problem: nobody knows you exist, and the people who need physiotherapy are choosing someone they already trust. AnchorStep had to feel established, safe and credible on day one, make booking an appointment effortless enough that intent never leaks away, and, the part most agencies skip, actually generate demand from nothing. Not just a launch, but momentum that keeps building.',
			approach: [
				{ title: 'A calm clinical brand', desc: 'An identity that signals expertise and warmth in the same breath, the kind that makes a brand-new practice feel safe and established.' },
				{ title: 'A booking-first website', desc: 'Appointments scheduled in a couple of taps, with live chat, every visitor is one short step from becoming a patient.' },
				{ title: 'Clear service architecture', desc: 'Musculoskeletal, neuro, paediatric, massage, structured so every condition finds its treatment fast, with zero confusion.' },
				{ title: 'A multi-platform growth engine', desc: 'Web plus a steady social presence, growing together, we built the audience from absolute zero, not just a launch.' },
			],
			highlights: [
				{ title: 'Book in two taps', desc: 'An appointment form and live chat that turn a visitor into a patient without friction.' },
				{ title: 'Trust on first glance', desc: 'Evidence-based copy and a considered brand that make a new practice feel safe and established.' },
				{ title: 'Growth, not just a launch', desc: 'We grew this across multiple platforms, the website is one piece of a wider, compounding presence.' },
			],
			results: [
				{ stat: '0 → live', label: 'from nothing to a booking brand' },
				{ stat: 'Multi-platform', label: 'web + social, growing together' },
				{ stat: 'Same-week', label: 'appointments, booked online' },
			],
			quote: { text: 'They didn’t just build a website. They built our presence and our audience from scratch.', who: 'AnchorStep Physiotherapy' },
			services: ['Brand & design', 'Web development', 'Marketing & growth', 'Maintenance'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-anchorstep.jpg', label: 'About & approach', caption: 'The practice, its promise and a booking button in reach.' },
				{ kind: 'image', src: '/images/portfolio/shot-anchorstep-services.jpg', label: 'Services & treatments', caption: 'Every treatment, in the words a patient would use.' },
				{ kind: 'image', src: '/images/portfolio/shot-anchorstep-care.jpg', label: 'Why AnchorStep', caption: 'The trust case, made in one screen.' },
			],
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
				'Binas Residence is a premium residential hotel in Abuja, with beautifully appointed standard, deluxe and master suites, a restaurant that cooks with locally sourced ingredients, a signature pool bar, 24/7 power and fibre, and the kind of anticipatory service that quietly turns a stay into a memory. A property like this is sold long before a guest arrives, in the first few seconds of looking at it online. So our job was to make the website feel exactly as considered, calm and expensive as the residence itself: a digital front door that says "you have chosen well" and then makes booking the easiest part of the trip.',
			challenge:
				'Luxury hospitality lives or dies on first impressions, and online that impression is unforgiving: a stock-photo grid, a clumsy form or a slow page, and a discerning traveller is gone. The site had to feel restrained and premium without ever shouting, let the property’s own photography carry the emotion, and quietly do the commercial work: surfacing the right suite, answering the unspoken questions, and turning a curious browser into a confirmed reservation without a single moment of friction.',
			approach: [
				{ title: 'A restrained, editorial brand', desc: 'Warm neutrals, generous white space and confident type, a brand that feels expensive and calm without ever shouting.' },
				{ title: 'Room-and-suite architecture', desc: 'Structured to sell the experience, not just the nightly rate, every suite gets the staging it deserves.' },
				{ title: 'Reservations where intent peaks', desc: 'Booking and enquiry calls-to-action placed at exactly the moments a guest decides, present, never pushy.' },
				{ title: 'Photography-led layouts', desc: 'Full-bleed imagery and quiet typography that step back and let the property do the talking.' },
			],
			highlights: [
				{ title: 'Quietly upscale', desc: 'Every detail says premium without shouting, the brand does the selling.' },
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
				{ kind: 'image', src: '/images/portfolio/shot-binas-rooms.jpg', label: 'Rooms & suites', caption: 'Every suite priced, photographed and one tap from booked.' },
			],
		},
	},
	{
		slug: 'jobblander',
		name: 'JobbLander',
		tagline: 'Job Application as a Service, AI-enhanced, human-perfected.',
		blurb:
			'A career-acceleration platform (JaaS) that pairs AI with human expertise to optimise CVs, LinkedIn and ATS, then land the interview.',
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
				'JobbLander is a premium end-to-end career service that bridges the gap between technology and the human touch. While we utilize advanced AI to identify patterns and optimize for ATS algorithms, every CV, LinkedIn profile, and career strategy is meticulously refined by our human professionals. From career mapping to JaaS (Job Application as a Service), we ensure your professional story is authentic, data-driven, and designed to land you the interview. Our role was to make all of that legible and irresistible: to take a layered, human-plus-AI service and give it a brand, a product experience and a story premium enough that a serious professional trusts it with the thing they care about most: their next role.',
			challenge:
				'"AI for your career" is a crowded, sceptical category, crowded with one-click résumé generators that promise the moon and deliver a template. JobbLander is the opposite, a genuinely human, expert-led service with AI underneath, and that nuance is hard to convey in a glance. The challenge was to make the product feel unmistakably premium and trustworthy, to communicate the human-plus-AI difference instantly, and to turn a multi-step, high-touch service (career mapping, CV, LinkedIn, ATS optimisation, strategy) into a journey that feels simple, safe and clearly worth paying for.',
			approach: [
				{ title: 'Positioned as JaaS', desc: 'We framed the product as Job Application as a Service, strategic career advancement, not another CV template, and built the whole story around that.' },
				{ title: 'A premium, trustworthy brand', desc: 'An identity and site that sell the human-plus-AI difference and justify a premium price, "serious career partner", not gimmick.' },
				{ title: 'A clear path to interview-ready', desc: 'Service tiers and a guided journey from upload to CV, LinkedIn and strategy, every step legible and easy to commit to.' },
				{ title: 'Trust, engineered in', desc: 'A product experience tuned to feel safe and credible at every step, because that is what makes someone pay for their career.' },
			],
			highlights: [
				{ title: 'AI, then humans', desc: 'AI optimises for ATS; real experts make the story authentic, and we made that promise legible.' },
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
				{ kind: 'image', src: '/images/portfolio/shot-jobblander-services.jpg', label: 'The service tiers', caption: 'Four ways in, each one explained before it is sold.' },
			],
		},
	},
	{
		slug: 'african-energy',
		name: 'African Energy Advocacy Initiative',
		tagline: 'Energy, oil & gas and consultancy, with a conscience.',
		blurb:
			'A mission-driven platform for clean-energy advocacy and energy consultancy, with solar lighting and efficient cookstoves for vulnerable communities.',
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
				'The African Energy Advocacy Initiative works right across the energy spectrum: policy advocacy, energy and oil-and-gas consultancy, and on-the-ground clean-energy projects like solar lighting and efficient cookstoves that measurably improve safety, health and livelihoods for vulnerable communities. It is an unusually broad mandate: in one breath it speaks to ministries and industry, and in the next to a rural household choosing a cleaner stove. We were brought in to give all of that a single, coherent home: a brand and website that hold the policy, the consultancy and the grassroots impact together without any one of them feeling like an afterthought.',
			challenge:
				'Most organisations do one thing; AEAI does several, for several very different audiences. A funder or government partner needs rigour, governance and credibility. A community partner needs warmth, clarity and proof that the work changes lives. The challenge was to build one home that serves both at once, institutional enough to be taken seriously in an energy-policy room and human enough to mean something in a village, then to make a sprawling, multi-mission organisation feel focused, legible and genuinely hopeful.',
			approach: [
				{ title: 'A vision-led narrative', desc: 'We found the thread that unifies advocacy, energy & oil-and-gas consultancy and grassroots clean-energy projects, one story, told with conviction.' },
				{ title: 'A clean, optimistic brand', desc: 'An identity built around clean energy that reads credible to institutions and hopeful to the communities being served.' },
				{ title: 'Impact, structured to be read', desc: 'Programmes and metrics organised for two audiences at once, funders skimming for rigour and the public looking for hope.' },
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
				{ kind: 'image', src: '/images/portfolio/shot-africaneai-focus.jpg', label: 'Focus areas', caption: 'Advocacy, advisory, research and youth capacity, side by side.' },
			],
		},
	},
	{
		slug: 'betslipswitch',
		name: 'Betslipswitch',
		tagline: '100k+ downloads. No.2 sports app in Zambia.',
		blurb:
			'A free sports platform that converts bet codes across bookmakers in seconds, wrapped in livescores, rated predictions and a community, and grown to over 100,000 downloads and became the No.2 most-used sports app in Zambia.',
		img: '/images/portfolio/betslipswitch.jpg',
		url: null,
		host: 'Betslipswitch',
		sector: 'product',
		tags: ['Mobile app', 'Web app', 'Sports'],
		color: '#1f9d55',
		year: '2022',
		featured: true,
		kind: 'web',
		caseStudy: {
			meta: { client: 'Betslipswitch', sector: 'Sports tech · Consumer app', year: '2022', scope: 'Product strategy · Web + mobile app · Brand · Growth' },
			intro:
				'Betslipswitch began as a genuinely useful idea: punters lose time and money re-typing bet codes when they want to play a slip from one bookmaker on another. We turned that single, sharp utility into a full consumer product: a free bet-code converter that switches codes across bookmakers in seconds, wrapped in livescores, rated predictions and a community of tipsters and sports fans, on the web and as a native app on the App Store and Play Store. It worked. The product crossed 100,000+ downloads and, three years ago, became the No.2 most-used sports app in Zambia, a market it was never even originally built for. That is the kind of pull a tool gets when the core job is flawless and the experience earns a daily open.',
			challenge:
				'The hard part of a utility is that people use it once and leave. The brief was to take instant bet-code conversion and make it so fast and so reliable that it became a habit, then surround it with enough reasons to stay that it could grow into a real community product, scale across markets, and stay rock-solid on the busiest match days when thousands of people hit it at once.',
			approach: [
				{ title: 'A converter that just works', desc: 'We obsessed over the core job, Sportybet to Nairabet and back in seconds, accurate every time. Speed and trust here are the entire product; if the conversion is ever wrong or slow, nothing else matters. So we made it flawless first.' },
				{ title: 'Reasons to come back daily', desc: 'A converter is a once-in-a-while tool; a sports companion is a daily one. We wove in livescores and rated predictions so the app earns an open even when there is no code to convert, turning a utility into a habit.' },
				{ title: 'A community with its own gravity', desc: 'We added a community layer, tipsters, chat and shared codes, so the product stopped being a solo tool and became a place. That network effect is what powered word-of-mouth growth across a whole new market.' },
				{ title: 'Web + native, built to scale', desc: 'One coherent product across the web and native iOS and Android, shipped to both stores, engineered to stay fast and reliable through spikes, and maintained, because an app at No.2 in a country cannot afford a bad match day.' },
			],
			highlights: [
				{ title: 'Convert in seconds', desc: 'The core utility, transfer bet codes across bookmakers instantly and accurately, done so well it became the reason people told their friends.' },
				{ title: 'A reason to stay', desc: 'Livescores and rated predictions turned a one-off converter into a daily sports companion, lifting retention and engagement.' },
				{ title: 'A market-leading product', desc: 'The community, the speed and the polish compounded into 100k+ downloads and the No.2 spot among sports apps in Zambia.' },
			],
			results: [
				{ stat: '100k+', label: 'downloads' },
				{ stat: 'No.2', label: 'sports app in Zambia (3 yrs ago)' },
				{ stat: 'Web + app', label: 'one product, every screen' },
			],
			quote: { text: 'It started as a converter and became the app everyone in the group chat was using.', who: 'Betslipswitch' },
			services: ['Product strategy', 'Web & mobile development', 'Brand & design', 'Growth & maintenance'],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/betslipswitch.jpg', label: 'The platform', caption: 'Free bet-code conversion, the job the whole product was built around.' },
			],
		},
	},
	{
		slug: 'afribarn-links',
		name: 'Afribarn Links',
		tagline: 'Powering agriculture, energizing communities.',
		blurb:
			'A bold site for an agritech and clean-energy company: farmer empowerment, solar integration and agribusiness advisory across sub-Saharan Africa.',
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
			'A landmark-grade site for a construction and engineering firm: end-to-end projects, dependable teams and quality you can see.',
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
			'A custom operations hub for a construction group: projects, inventory, suppliers, procurement and roles in one secured, real-time dashboard.',
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
			'A bold digital magazine of hard news, crime watch, lifestyle and culture, built to publish fast and read beautifully.',
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
			'A fast, content-heavy news platform for an independent Nigerian publication, covering politics, business and investigative reporting.',
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
			'A newsroom-style platform for a nonprofit that champions journalists, with flash stories, editor’s picks and deep category coverage.',
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
		tagline: 'A safe place to buy, lease and rent property in Nigeria.',
		blurb:
			'A property marketplace connecting buyers, sellers and agents, with search, listings and the tooling to keep deals moving.',
		img: '/images/portfolio/brix%20marketplace.jpg',
		url: null,
		host: 'brixmarket',
		sector: 'property',
		tags: ['Brand', 'Web app', 'Mobile app', 'Marketing', 'SEO'],
		color: '#3b82f6',
		year: '2022',
		featured: true,
		caseStudy: {
			intro:
				'Brixmarket is an online marketplace for Nigerian real estate: commercial buildings, homes, land and whole estates, listed for sale, lease or rent in one place. We have been on it since December 2021, and we built the whole thing, the brand, the interface, the web app, the mobile app and the growth work that brings people to it. The brief was never only software. It was to make strangers comfortable enough with each other to do the largest transaction of their lives.',
			challenge:
				'Property in Nigeria is a market of volatility and mistrust: prices that move, values that are hard to predict, and buyers who cannot tell a real listing from a wasted trip across town. Every marketplace here fails in the same place, which is confidence. The product had to make a listing feel verifiable, make search feel honest, and hold buyers, sellers and agents in the same room without any of them feeling outnumbered.',
			approach: [
				{ title: 'A brand built on trust, not gloss', desc: 'Identity, tone and interface were designed to feel steady and adult rather than loud, because the thing being sold is confidence before it is property.' },
				{ title: 'Search that respects the buyer', desc: 'Type, location, price range, bedrooms and status all sit on one screen, so a search narrows honestly instead of burying people in results they never wanted.' },
				{ title: 'One product, web and mobile', desc: 'The same catalogue and the same journey on the desktop where agents work and the phone where buyers actually browse, with listings that carry their own photography.' },
				{ title: 'Growth as part of the build', desc: 'SEO and social work ran alongside the product rather than after it, because a marketplace with no listings and no visitors is only a website.' },
			],
			highlights: [
				{ title: 'Sale, lease or rent, in one catalogue', desc: 'Commercial buildings, homes, land and estates live side by side, with the transaction type set at the point of search rather than buried in the listing.' },
				{ title: 'A room both sides can stand in', desc: 'Buyers, sellers and agents each get what they came for, which is what keeps a marketplace from tipping into a noticeboard.' },
				{ title: 'Kept alive since 2021', desc: 'We did not hand it over and leave. The platform has been maintained, marketed and improved continuously since launch.' },
			],
			results: [
				{ stat: 'Dec 2021', label: 'live, and looked after ever since' },
				{ stat: 'Web + app', label: 'one marketplace, every screen' },
				{ stat: 'Buy · Lease · Rent', label: 'three ways to transact, one flow' },
			],
			gallery: [
				{ kind: 'video', youtubeId: 'UAdl-wRVoQ0', label: 'The film', caption: 'Brixmarket, in motion.' },
				{ kind: 'image', src: '/images/portfolio/brix%20marketplace.jpg', label: 'The marketplace', caption: 'Search first: type, location and price, before anything else.' },
				{ kind: 'image', src: '/projects/brixmarket--grid-1.jpg', label: 'Listings', caption: 'Every property photographed and priced, on web and on the phone.' },
				{ kind: 'image', src: '/projects/brixmarket--grid-2-2.jpg', label: 'The app', caption: 'The same catalogue in the pocket of the person actually house-hunting.' },
			],
			services: ['Brand & identity', 'Product design', 'Web app', 'Mobile app', 'SEO & social', 'Maintenance'],
			meta: { client: 'Brixmarket', sector: 'Property & Build', year: '2021 to date', scope: 'Brand · Web + mobile app · Growth · Maintenance' },
		},
	},
	{
		slug: 'my-eya-estate',
		name: 'My Eya Estate',
		tagline: 'Property, presented beautifully.',
		blurb: 'A clean, trustworthy estate website where listings and enquiries turn browsers into buyers.',
		img: '/images/portfolio/my%20eya%20estate.jpg',
		url: null,
		host: 'myeyaestate',
		sector: 'property',
		tags: ['Website', 'Maintenance'],
		color: '#8b5cf6',
		year: '2023',
		caseStudy: {
			intro:
				'Estate agents live or die on trust. My Eya Estate needed a home on the web that felt as considered as the properties on it, where a listing could be read, believed and enquired about without a phone call first.',
			challenge:
				'Property sites tend to bury the property. Listings sit behind filters, photographs are squeezed into thumbnails, and the enquiry is a form at the bottom that nobody reaches. The brief was to put the homes first and make asking about one feel like a small, easy step.',
			approach: [
				{ title: 'Lead with the property', desc: 'Every listing is built around its photographs at the size they deserve, with the facts a buyer actually asks for sitting beside them rather than under a tab.' },
				{ title: 'A calm, trustworthy shell', desc: 'Generous type, plenty of white space and a restrained palette, so nothing on the page competes with the homes it is selling.' },
				{ title: 'Enquiry in reach', desc: 'The way to ask about a property follows you down the page, because the moment someone is interested is the moment to make it easy.' },
			],
			highlights: [
				{ title: 'Listings that read well', desc: 'A layout that works whether a property has twenty photographs or three.' },
				{ title: 'Built to be kept', desc: 'Listings are straightforward to add and edit, so the site stays current without us in the loop.' },
				{ title: 'Fast on a phone', desc: 'Most buyers arrive on a handset, so the pages are light and the images are sized for the screen they land on.' },
			],
			results: [
				{ stat: 'Live', label: 'in the market since 2023' },
				{ stat: 'Web', label: 'designed, built and maintained' },
				{ stat: 'One team', label: 'brand through to hosting' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/my%20eya%20estate.jpg', label: 'The estate site', caption: 'Listings given the room to sell themselves.' },
			],
			services: ['Website', 'Maintenance'],
			meta: { client: 'My Eya Estate', sector: 'Property · Estate agency', year: '2023', scope: 'Website · Maintenance' },
		},
	},
	{
		slug: 'appman',
		name: 'AppMan',
		tagline: 'School management, in the palm of your hand.',
		blurb:
			'A school-management platform with attendance via QR smart-IDs, computer-based testing and a parent/student portal, on web and mobile.',
		img: '/images/portfolio/shot-appman.jpg',
		url: null,
		host: 'AppMan',
		sector: 'product',
		tags: ['Mobile app', 'Web app', 'EdTech'],
		color: '#2bb3c0',
		year: '2022',
		kind: 'app',
		caseStudy: {
			intro:
				'AppMan set out to replace the paper that runs a school. Attendance registers, test papers, and the phone calls home all became one platform, on the web and in a pocket.',
			challenge:
				'A school runs on records that are easy to lose and hard to check. Registers are taken on paper, results are transcribed by hand, and parents hear about a problem long after it happened. Anything replacing that has to be quicker than the paper it replaces, or nobody uses it.',
			approach: [
				{ title: 'Attendance in a second', desc: 'Smart ID cards and a QR scan take a register in the time it takes to walk through a door, with the record written as it happens.' },
				{ title: 'Testing on the computer', desc: 'Papers are set, sat and marked in the platform, so results exist the moment a test ends rather than a week later.' },
				{ title: 'A door for parents', desc: 'A portal for students and parents, so attendance and results are something you can look up instead of something you wait to be told.' },
			],
			highlights: [
				{ title: 'QR smart IDs', desc: 'One card per student, scanned at the door, no register to carry or lose.' },
				{ title: 'Computer-based testing', desc: 'Tests set once, sat on any machine, marked automatically.' },
				{ title: 'Web and mobile together', desc: 'The same platform in the office and in a pocket, built by one team so the two never drift.' },
			],
			results: [
				{ stat: 'Web + mobile', label: 'one platform, two faces' },
				{ stat: '3 roles', label: 'staff, students and parents' },
				{ stat: '2022', label: 'designed, built and shipped' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-appman.jpg', label: 'AppMan', caption: 'The school, in the palm of a hand.' },
			],
			services: ['Mobile app', 'Web app', 'EdTech'],
			meta: { client: 'AppMan', sector: 'Education · School management', year: '2022', scope: 'Product · Web app · Mobile app' },
		},
	},
	{
		slug: 'buygas',
		name: 'BuyGas',
		tagline: 'Cooking gas, delivered.',
		blurb:
			'A platform-as-a-service connecting gas merchants to customers: easy, affordable cooking-gas ordering and delivery, tracked from tap to doorstep.',
		img: '/images/portfolio/shot-buygas.jpg',
		url: null,
		host: 'BuyGas',
		sector: 'product',
		tags: ['Mobile app', 'Delivery', 'PaaS'],
		color: '#22c55e',
		year: '2023',
		kind: 'app',
		caseStudy: {
			intro:
				'Buying cooking gas usually means carrying a cylinder to a merchant and carrying it back. BuyGas put the merchants on a platform and the delivery on a map, so the cylinder comes to you.',
			challenge:
				'Two sides had to be served at once. Customers want a price, a time and a way to see where their order is. Merchants want orders they can actually fulfil, without a second job managing an app. Neither side tolerates a slow or confusing flow when the alternative is a short walk.',
			approach: [
				{ title: 'Order in a few taps', desc: 'Size, address, time. The ordering path is short enough to finish while the kettle boils.' },
				{ title: 'Merchants on the platform', desc: 'A dashboard for the people filling the orders, built around what they need to see on a busy afternoon rather than what looks good in a demo.' },
				{ title: 'Tracked to the doorstep', desc: 'The order has a state you can look at, so nobody has to ring to find out where the gas is.' },
			],
			highlights: [
				{ title: 'Platform as a service', desc: 'Merchants join the platform rather than commissioning software of their own.' },
				{ title: 'Delivery tracking', desc: 'From tap to doorstep, visible on both sides of the order.' },
				{ title: 'Built for a handset', desc: 'Designed phone first, because that is where the order is placed.' },
			],
			results: [
				{ stat: 'Two-sided', label: 'customers and merchants' },
				{ stat: 'Mobile', label: 'ordering and tracking' },
				{ stat: '2023', label: 'designed and built' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/shot-buygas.jpg', label: 'BuyGas', caption: 'Cooking gas, ordered and tracked.' },
			],
			services: ['Mobile app', 'Delivery', 'PaaS'],
			meta: { client: 'BuyGas', sector: 'Logistics · Energy', year: '2023', scope: 'Product · Mobile app · Platform' },
		},
	},
	{
		slug: 'beauty-hive',
		name: 'Beauty Hive',
		tagline: 'Beauty commerce that converts.',
		blurb: 'A beauty storefront built to sell, with product merchandising, a smooth checkout and a brand that pops.',
		img: '/images/portfolio/beauty-hive.webp',
		url: null,
		host: 'beautyhive',
		sector: 'commerce',
		tags: ['E-commerce', 'Branding'],
		color: '#ec4899',
		year: '2023',
		caseStudy: {
			intro:
				'Beauty is sold on how it looks, and then on how easily you can buy it. Beauty Hive needed both: a brand with presence and a storefront that gets out of the way at checkout.',
			challenge:
				'Beauty storefronts are crowded places. Ranges are wide, shades multiply, and a shopper who cannot find the exact product they want leaves. The store had to merchandise a deep catalogue without turning the homepage into a catalogue.',
			approach: [
				{ title: 'A brand with a face', desc: 'Identity, palette and type chosen to sit on a product shot without fighting it, so the brand carries across packaging and screen alike.' },
				{ title: 'Merchandising the range', desc: 'Products grouped the way a shopper thinks about them, with the bestsellers given room and the long tail kept findable.' },
				{ title: 'A checkout that closes', desc: 'The fewest steps the payment allows, on a phone, with nothing between wanting the product and owning it.' },
			],
			highlights: [
				{ title: 'Brand and store together', desc: 'Designed and built by one team, so the storefront actually looks like the brand.' },
				{ title: 'Product-first layouts', desc: 'Photography at the size it needs, with the detail underneath rather than in the way.' },
				{ title: 'Ready to grow', desc: 'New ranges drop into the structure without a redesign.' },
			],
			results: [
				{ stat: 'Brand + store', label: 'one commission' },
				{ stat: 'E-commerce', label: 'built to sell, not to browse' },
				{ stat: '2023', label: 'designed and shipped' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/beauty-hive.webp', label: 'Beauty Hive', caption: 'A storefront built to close the sale.' },
			],
			services: ['E-commerce', 'Branding'],
			meta: { client: 'Beauty Hive', sector: 'Commerce · Beauty', year: '2023', scope: 'Brand · Storefront · E-commerce' },
		},
	},
	{
		slug: 'purple-panda',
		name: 'Purple Panda',
		tagline: 'A brand with a pulse.',
		blurb: 'Brand and web for a marketing-led product: a distinctive identity and a site tuned for growth and SEO.',
		img: '/images/portfolio/purplepanda%20world.jpg',
		url: null,
		host: 'purplepanda',
		sector: 'commerce',
		tags: ['Branding', 'SEO', 'Website'],
		color: '#a855f7',
		year: '2022',
		caseStudy: {
			intro:
				'Purple Panda is a marketing-led product, which means the brand has to do the selling before anyone reads a word. We built an identity with a pulse and a site tuned to be found.',
			challenge:
				'A marketing product is judged on its own marketing. A quiet brand is a bad advert for what you sell, but a loud one that nobody can find is no better. The work had to be distinctive and legible to a search engine at the same time.',
			approach: [
				{ title: 'An identity that carries', desc: 'A mark and a palette strong enough to hold their own in a feed, and calm enough to live on a long page.' },
				{ title: 'Written to be found', desc: 'Structure, headings and copy built around what people actually search for, rather than fitted to the design afterwards.' },
				{ title: 'Tuned for growth', desc: 'Pages that load fast and read cleanly, because both are ranking factors and both are courtesies.' },
			],
			highlights: [
				{ title: 'Brand and site as one', desc: 'The identity was designed against the layouts it would live in.' },
				{ title: 'SEO in the foundations', desc: 'Built into the markup and the copy from the first page rather than bolted on.' },
				{ title: 'Room to campaign', desc: 'Landing pages drop into the system without breaking the look.' },
			],
			results: [
				{ stat: 'Brand + web', label: 'designed together' },
				{ stat: 'SEO', label: 'built in, not bolted on' },
				{ stat: '2022', label: 'shipped' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/purplepanda%20world.jpg', label: 'Purple Panda', caption: 'A brand with a pulse.' },
			],
			services: ['Branding', 'SEO', 'Website'],
			meta: { client: 'Purple Panda', sector: 'Commerce · Marketing', year: '2022', scope: 'Brand · Website · SEO' },
		},
	},
	{
		slug: 'saros',
		name: 'Saros',
		tagline: 'Learning, made simple.',
		blurb: 'An education platform designed around the people who use it: clear, calm and dependable.',
		img: '/images/portfolio/sarosgp.jpg',
		url: null,
		host: 'sarosgp',
		sector: 'product',
		tags: ['Website', 'Maintenance'],
		color: '#f97316',
		year: '2023',
		caseStudy: {
			intro:
				'Saros teaches, and everything on the platform had to serve that. Not a prospectus with a login, but a place where a learner, a parent and a tutor each find what they came for.',
			challenge:
				'Education platforms are built for three audiences who want different things from the same page. Students want the work. Parents want reassurance. Staff want the admin to take less time than it used to. Serve one badly and the platform is not used.',
			approach: [
				{ title: 'Clear before clever', desc: 'Plain language, obvious routes and a calm palette, because a learner who is lost is a learner who stops.' },
				{ title: 'Three audiences, one place', desc: 'Structure that gives each of the three a front door without three separate products to maintain.' },
				{ title: 'Dependable, then pretty', desc: 'Pages that hold up on a slow connection and an old handset first; the polish sits on top of that, not instead of it.' },
			],
			highlights: [
				{ title: 'Designed around the reader', desc: 'Type sized for long reading, not for a screenshot.' },
				{ title: 'Maintained, not handed over', desc: 'We stayed on after launch for updates and uptime.' },
				{ title: 'Built to be added to', desc: 'New programmes and pages fit the system as it stands.' },
			],
			results: [
				{ stat: 'Live', label: 'in the market since 2023' },
				{ stat: '3 audiences', label: 'students, parents, staff' },
				{ stat: 'Maintained', label: 'by the team that built it' },
			],
			gallery: [
				{ kind: 'image', src: '/images/portfolio/sarosgp.jpg', label: 'Saros', caption: 'Learning, made simple.' },
			],
			services: ['Website', 'Maintenance'],
			meta: { client: 'Saros', sector: 'Education · Learning platform', year: '2023', scope: 'Website · Maintenance' },
		},
	},
];

export const featuredProjects = projects.filter((p) => p.caseStudy);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

// ── Where a named project should send a reader ──────────────────────────
// Some works have a full case study at /work/<slug>. A few older ones keep
// their long-form story in the portfolio collection. The rest have no page
// of their own, so they open the portfolio cabinet on their own card, where
// the write-up below is shown in full.
const legacyWriteups: Record<string, string> = {
	betslipswitch: 'betslipswitch',
	'hemam-synergy': 'hemamsynergy',
};

/** The longer description shown when a project has no page of its own. */
export const projectStories: Record<string, string[]> = {
	'my-eya-estate': [
		'My Eya Estate is a property business that needed to look as dependable online as it is in person. We built a calm, photography-led site where every listing is easy to scan and an enquiry is never more than a tap away.',
		'Our part covered the website itself and the ongoing maintenance behind it, so listings stay current and the pages keep loading fast for someone browsing on a phone.',
	],
	'beauty-hive': [
		'Beauty Hive is a beauty storefront built to sell rather than simply to exist. Products are merchandised the way a shopper actually browses, and the route from a first look to a finished checkout is kept deliberately short.',
		'We shaped the brand and the store together, so the personality on the homepage carries all the way through to the basket without the experience going flat halfway.',
	],
	'purple-panda': [
		'Purple Panda is a marketing-led product that needed an identity with a pulse and a site that could grow with it. We gave it a distinctive brand, then built pages tuned for search and for the campaigns running into them.',
		'Branding, website and SEO were treated as one job rather than three, which is why the site still reads as one voice from the first headline to the last footer link.',
	],
	appman: [
		'AppMan is a school-management platform that puts the daily running of a school in one place. Attendance is taken with QR smart-IDs, tests are sat on a computer, and parents and students get a portal of their own instead of a paper trail.',
		'We built it for web and mobile together, because the people using it are rarely at the same desk: an administrator on a laptop, a teacher on a phone at the classroom door, a parent checking in from anywhere.',
	],
	buygas: [
		'BuyGas connects cooking-gas merchants to the households that buy from them. Ordering is simple and affordable, and every delivery is tracked from the tap that starts it to the doorstep it arrives at.',
		'We built it as a platform rather than a single shop, so merchants can come on board and start selling without any of them needing an app of their own.',
	],
	saros: [
		'Saros is an education platform designed around the people who actually use it, students and the staff behind them. The interface stays clear and calm under pressure, which matters more here than any flourish.',
		'We built the platform and continue to maintain it, keeping it dependable through term-time peaks when everybody arrives at once.',
	],
};

export interface ProjectLink {
	href: string;
	label: string;
	external: boolean;
	host?: string;
	name: string;
	slug: string;
}

/** Resolve a project name to the best place to read about it. */
export const projectLink = (name: string): ProjectLink | null => {
	const key = name.trim().toLowerCase();
	const p = projects.find((x) => x.name.toLowerCase() === key);
	if (!p) return null;
	const base = { name: p.name, slug: p.slug };
	if (p.caseStudy) return { ...base, href: `/work/${p.slug}`, label: 'Read the write-up', external: false };
	const legacy = legacyWriteups[p.slug];
	if (legacy) return { ...base, href: `/portfolio/${legacy}`, label: 'Read the write-up', external: false };
	if (p.url) return { ...base, href: p.url, label: 'Visit the live site', external: true, host: p.host };
	return { ...base, href: `/portfolio#work-${p.slug}`, label: 'Read the write-up', external: false };
};
