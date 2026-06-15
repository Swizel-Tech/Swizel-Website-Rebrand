// Single source of truth for the Boardroom "Services" world — used by the hub
// (ServicesBoardroom) and the per-service detail pages (/services/<slug>).

export interface SubService {
	title: string;
	desc: string;
	items: string[];
}

export interface Discipline {
	slug: string;
	n: string;
	icon: string;
	cursor: string;
	color: string;
	title: string;
	tagline: string;
	/** short blurb on the hub card */
	desc: string;
	/** sub-service names shown as chips on the hub card */
	items: string[];
	/** longer hero line on the detail page */
	heroDesc: string;
	/** "what it is" overview on the detail page */
	overview: string;
	/** detailed sub-services on the detail page */
	included: SubService[];
	/** how we approach this discipline — 3 steps */
	approach: { n: string; title: string; desc: string }[];
	/** punchy outcome line */
	outcome: string;
}

export const disciplines: Discipline[] = [
	{
		slug: 'design',
		n: '01',
		icon: 'mdi:palette-outline',
		cursor: 'palette',
		color: '#22d3ee',
		title: 'Design',
		tagline: 'Brand & product design people feel.',
		desc: 'Identity, interfaces and motion that make your product effortless and unmistakably yours.',
		items: ['Brand identity', 'UI/UX design', 'Prototyping', 'Design systems', 'Motion'],
		heroDesc:
			'From a blank page to a brand people trust — and interfaces they barely have to think about.',
		overview:
			"Great design isn't decoration. It's how your product earns trust in the first three seconds and keeps it long after. We shape identity, interface and motion into one coherent experience that feels obvious to your customers and unmistakable in your market.",
		included: [
			{
				title: 'Brand identity',
				desc: 'Logos, colour, type and a voice that make you instantly recognisable.',
				items: ['Logo & marks', 'Brand guidelines', 'Social kit'],
			},
			{
				title: 'UI/UX design',
				desc: 'Interfaces designed around the people who actually use them.',
				items: ['Wireframes', 'Hi-fi UI', 'Interaction design'],
			},
			{
				title: 'Prototyping & testing',
				desc: 'Clickable prototypes, validated with real users before a line of code.',
				items: ['Prototypes', 'Usability testing', 'Iteration'],
			},
			{
				title: 'Design systems',
				desc: 'A reusable kit so the product stays consistent as it scales.',
				items: ['Components', 'Design tokens', 'Documentation'],
			},
		],
		approach: [
			{ n: '01', title: 'Understand', desc: 'We dig into your users, market and goals before sketching anything.' },
			{ n: '02', title: 'Design', desc: 'Identity, flows and screens — explored fast, then refined.' },
			{ n: '03', title: 'Validate', desc: 'We test with real people and hand off pixel-perfect, dev-ready files.' },
		],
		outcome: 'A product that looks like it belongs at the top of its market.',
	},
	{
		slug: 'development',
		n: '02',
		icon: 'mdi:code-tags',
		cursor: 'term',
		color: '#3b82f6',
		title: 'Development',
		tagline: 'Software built to ship and scale.',
		desc: 'Web and mobile engineering with modern stacks, tested and shipped fast — without breaking things.',
		items: ['Web apps', 'iOS & Android', 'APIs & backends', 'E-commerce', 'Integrations'],
		heroDesc:
			'Web and mobile products engineered to ship fast, scale cleanly and run for years.',
		overview:
			'We build the real thing — fast, reliable software on modern, battle-tested stacks. Mobile-first by default, tested as we go, and architected so it keeps performing as your numbers grow.',
		included: [
			{
				title: 'Web applications',
				desc: 'Fast, accessible web apps that work everywhere.',
				items: ['React / Next.js', 'Vue', 'PHP / Python'],
			},
			{
				title: 'Mobile apps',
				desc: 'Native-quality iOS and Android from one focused team.',
				items: ['Flutter', 'Native iOS', 'Native Android'],
			},
			{
				title: 'APIs & backends',
				desc: 'Secure, documented services your product can grow on.',
				items: ['REST & GraphQL', 'Databases', 'Cloud infra'],
			},
			{
				title: 'E-commerce & integrations',
				desc: 'Storefronts, payments and the tools you already use, wired together.',
				items: ['Payments', 'Third-party APIs', 'Headless commerce'],
			},
		],
		approach: [
			{ n: '01', title: 'Architect', desc: 'We choose the right stack and shape a plan you can see.' },
			{ n: '02', title: 'Build & test', desc: 'Shipped in tight, visible loops with tests along the way.' },
			{ n: '03', title: 'Launch', desc: 'Deployed, monitored and ready for real traffic from day one.' },
		],
		outcome: 'Software that holds up the day a thousand users show up at once.',
	},
	{
		slug: 'marketing',
		n: '03',
		icon: 'mdi:bullhorn-outline',
		cursor: 'pulse',
		color: '#8b5cf6',
		title: 'Marketing',
		tagline: 'Growth across every platform that matters.',
		desc: 'Data-driven campaigns that deliver conversions, not just clicks — and grow the audience around your product.',
		items: ['SEO', 'Paid ads', 'Social', 'Content', 'Email'],
		heroDesc:
			'We grow the audience around your product — and turn attention into customers.',
		overview:
			"Shipping a great product is half the job; the other half is being found and chosen. We run data-driven marketing that delivers conversions, not vanity metrics — across search, social, content and paid.",
		included: [
			{
				title: 'Search (SEO & SEM)',
				desc: 'Get found by people already looking for what you do.',
				items: ['SEO', 'Search ads', 'Content marketing'],
			},
			{
				title: 'Social media',
				desc: 'Build an audience and keep them engaged.',
				items: ['Instagram', 'Facebook', 'YouTube / TikTok'],
			},
			{
				title: 'Paid acquisition',
				desc: 'Campaigns tuned for conversions, not clicks.',
				items: ['Meta ads', 'Google ads', 'Retargeting'],
			},
			{
				title: 'Content & email',
				desc: 'Stories and sequences that nurture and convert.',
				items: ['Content strategy', 'Email flows', 'Copywriting'],
			},
		],
		approach: [
			{ n: '01', title: 'Research', desc: 'We learn your audience, market and the numbers that matter.' },
			{ n: '02', title: 'Launch', desc: 'Campaigns go live across the channels that fit your goals.' },
			{ n: '03', title: 'Optimise', desc: 'We read the data and double down on what converts.' },
		],
		outcome: 'More of the right people finding you — and buying.',
	},
	{
		slug: 'strategy',
		n: '04',
		icon: 'mdi:compass-outline',
		cursor: 'vector',
		color: '#f59e0b',
		title: 'Strategy',
		tagline: 'The plan before the pixels.',
		desc: 'Research, definition and a roadmap that turns an ambitious idea into a product worth building.',
		items: ['Discovery', 'Product roadmap', 'UX research', 'MVP scoping', 'Analytics'],
		heroDesc:
			'We turn a big idea into a clear, fundable plan — before a single pixel is drawn.',
		overview:
			'The most expensive mistakes happen before anyone writes code. We pressure-test the idea, define the audience and scope the smallest version worth shipping — so you build the right thing, once.',
		included: [
			{
				title: 'Discovery & research',
				desc: 'Understand the problem, the users and the competition.',
				items: ['User research', 'Market analysis', 'Workshops'],
			},
			{
				title: 'Product strategy',
				desc: 'Define what to build, for whom, and why now.',
				items: ['Positioning', 'Feature priority', 'Success metrics'],
			},
			{
				title: 'Roadmap & MVP',
				desc: 'Scope the smallest version that proves the idea.',
				items: ['MVP scoping', 'Roadmap', 'Estimates'],
			},
			{
				title: 'Analytics & measurement',
				desc: 'Decide how you’ll know it’s working — from day one.',
				items: ['KPIs', 'Tracking plan', 'Dashboards'],
			},
		],
		approach: [
			{ n: '01', title: 'Listen', desc: 'We learn your goals, constraints and the people you serve.' },
			{ n: '02', title: 'Define', desc: 'We turn it into a sharp, prioritised plan everyone agrees on.' },
			{ n: '03', title: 'Map', desc: 'A roadmap and MVP scope you can take straight into build.' },
		],
		outcome: 'A plan you can fund, build and measure — with no guesswork.',
	},
	{
		slug: 'maintenance',
		n: '05',
		icon: 'mdi:shield-check-outline',
		cursor: 'shield',
		color: '#10b981',
		title: 'Maintenance',
		tagline: 'It keeps running while you sleep.',
		desc: 'Hosting, monitoring and support that keep complex systems secure, fast and online — year after year.',
		items: ['Hosting & DevOps', 'Monitoring', '24/7 support', 'Security', 'Backups'],
		heroDesc:
			'We stay after launch — keeping your product secure, fast and online, year after year.',
		overview:
			"Launch day isn't the finish line. We host, monitor and improve what we ship — patching, scaling and securing it so the board never has to ask twice. 99.9% uptime, watched around the clock.",
		included: [
			{
				title: 'Hosting & DevOps',
				desc: 'Reliable infrastructure that scales with your traffic.',
				items: ['Cloud hosting', 'CI/CD', 'Scaling'],
			},
			{
				title: 'Monitoring & uptime',
				desc: 'We see problems before your users do.',
				items: ['24/7 monitoring', 'Alerts', '99.9% uptime'],
			},
			{
				title: 'Security & backups',
				desc: 'Hardened, patched and recoverable — always.',
				items: ['Security audits', 'Automated backups', 'Patching'],
			},
			{
				title: 'Support & improvements',
				desc: 'A team on call to fix, tune and add what you need.',
				items: ['Same-day response', 'Bug fixes', 'New features'],
			},
		],
		approach: [
			{ n: '01', title: 'Onboard', desc: 'We map your systems and set up monitoring and backups.' },
			{ n: '02', title: 'Watch', desc: 'Round-the-clock monitoring, patching and tuning.' },
			{ n: '03', title: 'Improve', desc: 'Steady upgrades so the product keeps getting better.' },
		],
		outcome: 'Software you never have to worry about.',
	},
	{
		slug: 'ai-automation',
		n: '06',
		icon: 'mdi:robot-outline',
		cursor: 'repo',
		color: '#ec4899',
		title: 'AI & Automation',
		tagline: 'Put the busywork on autopilot.',
		desc: 'Smart features and automations that save hours — chat, workflows and data working for you.',
		items: ['AI features', 'Chatbots', 'Workflow automation', 'Data pipelines'],
		heroDesc:
			'We weave AI and automation into your product so the busywork runs itself.',
		overview:
			'The hours your team spends on repetitive work are hours you could spend growing. We build AI features and automations — assistants, workflows and data pipelines — that quietly do the heavy lifting.',
		included: [
			{
				title: 'AI features',
				desc: 'Smart search, recommendations and assistants built into your product.',
				items: ['LLM integration', 'Smart search', 'Recommendations'],
			},
			{
				title: 'Chatbots & assistants',
				desc: 'Answer customers and staff instantly, around the clock.',
				items: ['Support bots', 'Internal copilots', 'Voice / chat'],
			},
			{
				title: 'Workflow automation',
				desc: 'Connect your tools so manual steps disappear.',
				items: ['Integrations', 'Triggers & actions', 'No-code flows'],
			},
			{
				title: 'Data pipelines',
				desc: 'Move and shape data so it’s ready to use.',
				items: ['ETL', 'Dashboards', 'Reporting'],
			},
		],
		approach: [
			{ n: '01', title: 'Find', desc: 'We spot the repetitive work worth automating.' },
			{ n: '02', title: 'Build', desc: 'We wire in AI and automations, tested against real cases.' },
			{ n: '03', title: 'Measure', desc: 'We track the hours saved and tune for more.' },
		],
		outcome: 'Hours back every week — and a product that feels smart.',
	},
];

export const getDiscipline = (slug: string) =>
	disciplines.find((d) => d.slug === slug);
