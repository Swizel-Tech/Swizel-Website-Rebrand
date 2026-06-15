// Single source of truth for the Boardroom "Services" world — used by the hub
// (ServicesBoardroom), the per-service detail pages (/services/<slug>) and the
// nav dropdown.

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
	/** a one-line "what this actually means" clarifier */
	clarifier: string;
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
	/** ways we can work together — engagement options */
	ways: { icon: string; title: string; desc: string }[];
	/** a few projects we've done in this discipline (real Swizel work) */
	projects: { name: string; sector: string; img: string }[];
	/** label + sub for the media placeholder */
	media: { kind: 'image' | 'video'; label: string };
	/** a targeted review */
	review: { quote: string; name: string; role: string; img: string };
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
		clarifier: 'Logos & brand, UI/UX, prototypes and design systems.',
		items: ['Brand identity', 'UI/UX design', 'Prototyping', 'Design systems', 'Motion'],
		heroDesc:
			'From a blank page to a brand people trust — and interfaces they barely have to think about.',
		overview:
			"Great design isn't decoration. It's how your product earns trust in the first three seconds and keeps it long after. We shape identity, interface and motion into one coherent experience that feels obvious to your customers and unmistakable in your market.",
		included: [
			{ title: 'Brand identity', desc: 'Logos, colour, type and a voice that make you instantly recognisable.', items: ['Logo & marks', 'Brand guidelines', 'Social kit'] },
			{ title: 'UI/UX design', desc: 'Interfaces designed around the people who actually use them.', items: ['Wireframes', 'Hi-fi UI', 'Interaction design'] },
			{ title: 'Prototyping & testing', desc: 'Clickable prototypes, validated with real users before a line of code.', items: ['Prototypes', 'Usability testing', 'Iteration'] },
			{ title: 'Design systems', desc: 'A reusable kit so the product stays consistent as it scales.', items: ['Components', 'Design tokens', 'Documentation'] },
		],
		approach: [
			{ n: '01', title: 'Understand', desc: 'We dig into your users, market and goals before sketching anything.' },
			{ n: '02', title: 'Design', desc: 'Identity, flows and screens — explored fast, then refined with you.' },
			{ n: '03', title: 'Validate', desc: 'We test with real people and hand off pixel-perfect, dev-ready files.' },
		],
		ways: [
			{ icon: 'mdi:creation-outline', title: 'From scratch or a refresh', desc: 'A brand-new identity, or a careful evolution of the one you already have.' },
			{ icon: 'mdi:hand-heart-outline', title: 'Design-only or design + build', desc: 'Hand the files to your own developers, or we design and build it together.' },
			{ icon: 'mdi:account-check-outline', title: 'Carried along, every step', desc: 'You review and steer at each stage — nothing ships until you love it.' },
		],
		projects: [
			{ name: 'Beauty Hive', sector: 'Beauty brand & store', img: '/images/portfolio/beauty-hive.webp' },
			{ name: 'Purple Panda', sector: 'Marketing identity', img: '/images/portfolio/purplepanda%20world.jpg' },
			{ name: 'My Eya Estate', sector: 'Real estate', img: '/images/portfolio/my%20eya%20estate.jpg' },
		],
		media: { kind: 'image', label: 'Design showcase' },
		review: {
			quote: '“They turned a vague idea into a brand we are genuinely proud of — and the interface just makes sense.”',
			name: 'Cheta', role: 'Client, e-commerce', img: '/testimonial/cheta.jpeg',
		},
		outcome: 'A product that looks like it belongs at the top of its market.',
	},
	{
		slug: 'development',
		n: '02',
		icon: 'mdi:code-tags',
		cursor: 'term',
		color: '#3b82f6',
		title: 'Development',
		tagline: 'Websites and apps, built to last.',
		desc: 'Websites, web apps and mobile apps — engineered on modern stacks, tested and shipped fast.',
		clarifier: 'Websites, web apps, iOS & Android apps, e-commerce and APIs.',
		items: ['Websites', 'Web apps', 'iOS & Android', 'E-commerce', 'APIs'],
		heroDesc:
			'Websites, web apps and mobile apps — engineered to ship fast, scale cleanly and run for years.',
		overview:
			"When people say “development” it can mean a hundred things — so let’s be clear: we build websites, web applications and mobile apps. Fast, reliable software on modern, battle-tested stacks, mobile-first by default, architected to keep performing as your numbers grow. And if you’d rather not build from scratch, we’ll set up and tailor Shopify, WordPress and the like instead.",
		included: [
			{ title: 'Websites', desc: 'Fast, beautiful marketing sites, blogs and landing pages.', items: ['Marketing sites', 'Blogs', 'Landing pages'] },
			{ title: 'Web applications', desc: 'Dashboards, portals and platforms that do real work.', items: ['React / Next.js', 'Vue', 'PHP / Python'] },
			{ title: 'Mobile apps', desc: 'Native-quality iOS and Android from one focused team.', items: ['Flutter', 'Native iOS', 'Native Android'] },
			{ title: 'E-commerce & integrations', desc: 'Storefronts, payments and the tools you already use, wired together.', items: ['Shopify / WooCommerce', 'Payments', 'Third-party APIs'] },
		],
		approach: [
			{ n: '01', title: 'Talk it through', desc: 'We sit with you, explore your idea and look at samples and options together.' },
			{ n: '02', title: 'Build & test', desc: 'Shipped in tight, visible loops — you can follow along every week or step back.' },
			{ n: '03', title: 'Launch & hand over', desc: 'Deployed, monitored, and — if you want — we teach your team to run it.' },
		],
		ways: [
			{ icon: 'mdi:hammer-wrench', title: 'From scratch — or not', desc: 'Bespoke software built for you, or we set up and tailor Shopify, WordPress and more.' },
			{ icon: 'mdi:account-switch-outline', title: 'Hands-on or hands-off', desc: 'We carry you along through every decision, or build and deploy while you focus on the business.' },
			{ icon: 'mdi:school-outline', title: 'Build & train', desc: 'We hand it over and teach your team to run it — post news, update content, manage the store.' },
		],
		projects: [
			{ name: 'Brixmarket', sector: 'Real estate marketplace', img: '/images/portfolio/brix%20marketplace.jpg' },
			{ name: 'Betslipswitch', sector: 'Sports platform', img: '/images/portfolio/betslipswitch.jpg' },
			{ name: 'Saros', sector: 'Education', img: '/images/portfolio/sarosgp.jpg' },
		],
		media: { kind: 'video', label: 'Product walkthrough' },
		review: {
			quote: '“Rock-solid. It launched on time and hasn’t skipped a beat since — even on our busiest days.”',
			name: 'Russell', role: 'Client, real estate', img: '/testimonial/russell.jpeg',
		},
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
		clarifier: 'SEO, paid ads, social, content and email — done for you or with you.',
		items: ['SEO', 'Paid ads', 'Social', 'Content', 'Email'],
		heroDesc:
			'We grow the audience around your product — and turn attention into customers.',
		overview:
			"Shipping a great product is half the job; the other half is being found and chosen. We run data-driven marketing that delivers conversions, not vanity metrics — across search, social, content and paid — and we can run it for you or coach your team to run it themselves.",
		included: [
			{ title: 'Search (SEO & SEM)', desc: 'Get found by people already looking for what you do.', items: ['SEO', 'Search ads', 'Content marketing'] },
			{ title: 'Social media', desc: 'Build an audience and keep them engaged.', items: ['Instagram', 'Facebook', 'YouTube / TikTok'] },
			{ title: 'Paid acquisition', desc: 'Campaigns tuned for conversions, not clicks.', items: ['Meta ads', 'Google ads', 'Retargeting'] },
			{ title: 'Content & email', desc: 'Stories and sequences that nurture and convert.', items: ['Content strategy', 'Email flows', 'Copywriting'] },
		],
		approach: [
			{ n: '01', title: 'Research', desc: 'We learn your audience, market and the numbers that matter.' },
			{ n: '02', title: 'Launch', desc: 'Campaigns go live across the channels that fit your goals.' },
			{ n: '03', title: 'Optimise', desc: 'We read the data with you and double down on what converts.' },
		],
		ways: [
			{ icon: 'mdi:account-switch-outline', title: 'Done for you or with you', desc: 'We run the whole engine, or coach your team and hand over the playbook.' },
			{ icon: 'mdi:rocket-launch-outline', title: 'One push or always-on', desc: 'A focused launch campaign, or steady, ongoing growth month after month.' },
			{ icon: 'mdi:school-outline', title: 'Set up & train', desc: 'We set up your channels and teach you to keep the momentum going.' },
		],
		projects: [
			{ name: 'Purple Panda', sector: 'Marketing', img: '/images/portfolio/purplepanda%20world.jpg' },
			{ name: 'Betslipswitch', sector: 'Sports', img: '/images/portfolio/betslipswitch.jpg' },
			{ name: 'Beauty Hive', sector: 'Beauty', img: '/images/portfolio/beauty-hive.webp' },
		],
		media: { kind: 'image', label: 'Campaign results' },
		review: {
			quote: '“Conversions, not clicks — exactly as promised. Our numbers climbed within weeks.”',
			name: 'Favour', role: 'Client, marketing', img: '/testimonial/favour.jpeg',
		},
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
		clarifier: 'Discovery, product roadmaps, UX research and MVP scoping.',
		items: ['Discovery', 'Product roadmap', 'UX research', 'MVP scoping', 'Analytics'],
		heroDesc:
			'We turn a big idea into a clear, fundable plan — before a single pixel is drawn.',
		overview:
			'The most expensive mistakes happen before anyone writes code. We pressure-test the idea, define the audience and scope the smallest version worth shipping — together, in the room with you — so you build the right thing, once.',
		included: [
			{ title: 'Discovery & research', desc: 'Understand the problem, the users and the competition.', items: ['User research', 'Market analysis', 'Workshops'] },
			{ title: 'Product strategy', desc: 'Define what to build, for whom, and why now.', items: ['Positioning', 'Feature priority', 'Success metrics'] },
			{ title: 'Roadmap & MVP', desc: 'Scope the smallest version that proves the idea.', items: ['MVP scoping', 'Roadmap', 'Estimates'] },
			{ title: 'Analytics & measurement', desc: 'Decide how you’ll know it’s working — from day one.', items: ['KPIs', 'Tracking plan', 'Dashboards'] },
		],
		approach: [
			{ n: '01', title: 'Listen', desc: 'We learn your goals, constraints and the people you serve.' },
			{ n: '02', title: 'Define', desc: 'We turn it into a sharp, prioritised plan everyone agrees on.' },
			{ n: '03', title: 'Map', desc: 'A roadmap and MVP scope you can take straight into build.' },
		],
		ways: [
			{ icon: 'mdi:timer-sand', title: 'A sprint or a partnership', desc: 'A focused discovery sprint, or ongoing strategy as you grow.' },
			{ icon: 'mdi:account-group-outline', title: 'Workshops with your team', desc: 'We plan with you, not at you — your people in the room, deciding together.' },
			{ icon: 'mdi:hand-heart-outline', title: 'Plan only, or plan + build', desc: 'Take the roadmap to any team, or let us build exactly what we mapped.' },
		],
		projects: [
			{ name: 'Brixmarket', sector: 'Real estate', img: '/images/portfolio/brix%20marketplace.jpg' },
			{ name: 'Saros', sector: 'Education', img: '/images/portfolio/sarosgp.jpg' },
			{ name: 'My Eya Estate', sector: 'Real estate', img: '/images/portfolio/my%20eya%20estate.jpg' },
		],
		media: { kind: 'image', label: 'Roadmap & research' },
		review: {
			quote: '“They saved us from building the wrong thing. The plan paid for itself before we wrote a line of code.”',
			name: 'Chidimma', role: 'Client, education', img: '/testimonial/chidima.jpeg',
		},
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
		clarifier: 'Hosting, monitoring, security, backups and ongoing support.',
		items: ['Hosting & DevOps', 'Monitoring', '24/7 support', 'Security', 'Backups'],
		heroDesc:
			'We stay after launch — keeping your product secure, fast and online, year after year.',
		overview:
			"Launch day isn't the finish line. We host, monitor and improve what we ship — patching, scaling and securing it so the board never has to ask twice. And we don't only look after what we built; we'll happily adopt your existing product too. 99.9% uptime, watched around the clock.",
		included: [
			{ title: 'Hosting & DevOps', desc: 'Reliable infrastructure that scales with your traffic.', items: ['Cloud hosting', 'CI/CD', 'Scaling'] },
			{ title: 'Monitoring & uptime', desc: 'We see problems before your users do.', items: ['24/7 monitoring', 'Alerts', '99.9% uptime'] },
			{ title: 'Security & backups', desc: 'Hardened, patched and recoverable — always.', items: ['Security audits', 'Automated backups', 'Patching'] },
			{ title: 'Support & improvements', desc: 'A team on call to fix, tune and add what you need.', items: ['Same-day response', 'Bug fixes', 'New features'] },
		],
		approach: [
			{ n: '01', title: 'Onboard', desc: 'We map your systems and set up monitoring and backups.' },
			{ n: '02', title: 'Watch', desc: 'Round-the-clock monitoring, patching and tuning.' },
			{ n: '03', title: 'Improve', desc: 'Steady upgrades so the product keeps getting better.' },
		],
		ways: [
			{ icon: 'mdi:account-switch-outline', title: 'We built it, or you did', desc: 'We maintain what we shipped — or adopt and stabilise your existing product.' },
			{ icon: 'mdi:sleep', title: 'Hands-off cover', desc: 'We watch, patch and fix while you focus on the rest of the business.' },
			{ icon: 'mdi:calendar-check-outline', title: 'On-call or retainer', desc: 'Pay as you go when you need us, or a steady monthly partnership.' },
		],
		projects: [
			{ name: 'Betslipswitch', sector: 'Sports', img: '/images/portfolio/betslipswitch.jpg' },
			{ name: 'Brixmarket', sector: 'Real estate', img: '/images/portfolio/brix%20marketplace.jpg' },
			{ name: 'Saros', sector: 'Education', img: '/images/portfolio/sarosgp.jpg' },
		],
		media: { kind: 'image', label: 'Uptime dashboard' },
		review: {
			quote: '“We sleep easy. Something breaks, it’s fixed before we even notice.”',
			name: 'Russell', role: 'Client, real estate', img: '/testimonial/russell.jpeg',
		},
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
		clarifier: 'AI features, chatbots, workflow automation and data pipelines.',
		items: ['AI features', 'Chatbots', 'Workflow automation', 'Data pipelines'],
		heroDesc:
			'We weave AI and automation into your product so the busywork runs itself.',
		overview:
			'The hours your team spends on repetitive work are hours you could spend growing. We build AI features and automations — assistants, workflows and data pipelines — that quietly do the heavy lifting, and we can bolt them onto the product you already have.',
		included: [
			{ title: 'AI features', desc: 'Smart search, recommendations and assistants built into your product.', items: ['LLM integration', 'Smart search', 'Recommendations'] },
			{ title: 'Chatbots & assistants', desc: 'Answer customers and staff instantly, around the clock.', items: ['Support bots', 'Internal copilots', 'Voice / chat'] },
			{ title: 'Workflow automation', desc: 'Connect your tools so manual steps disappear.', items: ['Integrations', 'Triggers & actions', 'No-code flows'] },
			{ title: 'Data pipelines', desc: 'Move and shape data so it’s ready to use.', items: ['ETL', 'Dashboards', 'Reporting'] },
		],
		approach: [
			{ n: '01', title: 'Find', desc: 'We spot the repetitive work worth automating.' },
			{ n: '02', title: 'Build', desc: 'We wire in AI and automations, tested against real cases.' },
			{ n: '03', title: 'Measure', desc: 'We track the hours saved and tune for more.' },
		],
		ways: [
			{ icon: 'mdi:puzzle-outline', title: 'Add to what you have', desc: 'Bolt AI and automation onto your existing product — no rebuild required.' },
			{ icon: 'mdi:account-switch-outline', title: 'Hands-on or hands-off', desc: 'Co-build with your team, or we deliver it done and ready to run.' },
			{ icon: 'mdi:school-outline', title: 'Build & train', desc: 'We ship it and teach your team to run and extend it.' },
		],
		projects: [
			{ name: 'Brixmarket', sector: 'Real estate', img: '/images/portfolio/brix%20marketplace.jpg' },
			{ name: 'Saros', sector: 'Education', img: '/images/portfolio/sarosgp.jpg' },
			{ name: 'Betslipswitch', sector: 'Sports', img: '/images/portfolio/betslipswitch.jpg' },
		],
		media: { kind: 'image', label: 'Automation in action' },
		review: {
			quote: '“The automations gave us back hours every week. Quietly brilliant.”',
			name: 'Cheta', role: 'Client, e-commerce', img: '/testimonial/cheta.jpeg',
		},
		outcome: 'Hours back every week — and a product that feels smart.',
	},
];

export const getDiscipline = (slug: string) =>
	disciplines.find((d) => d.slug === slug);
