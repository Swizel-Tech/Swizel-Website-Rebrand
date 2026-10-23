// Titles and descriptions for the four non-Boardroom worlds.
//
// Each world used to reuse Boardroom's title and description and carry
// noindex, because to a search engine five pages saying the same thing
// are one page and four copies. These six pages per world now say
// something of their own — written in the world's voice, for the
// person that world is for — so each can be indexed as a page in its
// own right. Nothing visible on the page changes: the title is the
// browser tab and the blue link in Google, the description is the grey
// snippet under it.
//
// Case studies and the per-service pages are deliberately NOT here. They
// tell the same project story in a different skin, so they keep
// canonicalising to the Boardroom page (see BaseHead.astro).
//
// Every title is under 60 characters and every description between 120
// and 160, the same rule as src/data/seo.ts; page-seo-check enforces it.
import type { World } from '../lib/worlds';
import { PAGES, type PageSeo } from './seo';

export type WorldPagePath = '/' | '/about' | '/services' | '/portfolio' | '/blog' | '/contact';

export const WORLD_PAGE_PATHS: readonly WorldPagePath[] = ['/', '/about', '/services', '/portfolio', '/blog', '/contact'];

type Entry = Pick<PageSeo, 'title' | 'description'>;

export const WORLD_SEO: Record<Exclude<World, 'boardroom'>, Record<WorldPagePath, Entry>> = {
	// Founder: founders — zero to MVP, fixed price, you own it
	founder: {
		'/': {
			title: 'MVP Development for Startups | Swizel Founder Mode',
			description:
				'From blank page to launched product in six weeks. Fixed scope, fixed price, and you own every line. We plan, build and ship your MVP, then stay to scale it.',
		},
		'/about': {
			title: 'The Team Behind Your MVP | Swizel Founder Mode',
			description:
				'Meet the designers, engineers and marketers who have launched 65+ products since 2019, and why founders from Abuja to New York trust them with a first version.',
		},
		'/services': {
			title: 'Startup Launch Services on One Contract | Swizel',
			description:
				'Design, development, marketing, strategy, maintenance and AI, on one contract. Everything a startup needs to launch and grow, without hiring six vendors.',
		},
		'/portfolio': {
			title: 'Startup Products We Have Launched | Swizel Founder Mode',
			description:
				'Real MVPs and products that went from idea to live, across fintech, real estate, sport, education and energy. The brief, the build and the result for each one.',
		},
		'/blog': {
			title: 'Startup Build Notes & Founder Insights | Swizel Journal',
			description:
				'Plain-English notes for founders on shipping a first product: scoping an MVP, picking a stack, launching and growing after, from the team that builds them.',
		},
		'/contact': {
			title: 'Start Your MVP: Talk to Swizel | Founder Mode',
			description:
				'Have an idea, or a product that is stuck? Send a short brief and a senior engineer replies within one business day with scope, timeline and a fixed price.',
		},
	},
	// Builder: engineers and technical buyers — one repo, one team
	builder: {
		'/': {
			title: 'Software Engineering Team for Hire | Swizel Builder Mode',
			description:
				'iOS and Android apps, web apps, PWAs, ERPs and proof-of-concepts, built by one senior team. 65+ products live in 10+ countries. Imagine it; we build it.',
		},
		'/about': {
			title: 'The Engineering Team Behind 65+ Products | Swizel Builder',
			description:
				'One repo, one team: designers, engineers and growth marketers shipping since 2019. Who writes the code, how we work together, and what we have deployed so far.',
		},
		'/services': {
			title: 'Engineering Services, Design to Deploy | Swizel Builder',
			description:
				'Six modules, zero hand-offs: product design, development, marketing, strategy, maintenance and AI automation, all maintained by the same team that built them.',
		},
		'/portfolio': {
			title: 'Production Deployments & Case Studies | Swizel Builder',
			description:
				'Every product we have shipped to production, with the stack, the sector and the result. Browse the deployment list, then read the full write-ups behind them.',
		},
		'/blog': {
			title: 'Engineering Notes from the Build | Swizel Journal',
			description:
				'Field notes on software engineering, product design, fintech, edtech and growth. What we are building, learning and seeing across the African digital landscape.',
		},
		'/contact': {
			title: 'Brief Our Engineers | Swizel Builder Mode',
			description:
				'Open a project with Swizel. Fill the brief and a senior engineer, not a sales desk, replies within one business day with scope, timeline and a fixed estimate.',
		},
	},
	// Campus: students, interns and NYSC — learn by building
	campus: {
		'/': {
			title: 'Learn Software by Building Real Products | Swizel Campus',
			description:
				'Do your IT placement or service year on a live product, beside the team that ships it. Mentored by the builders of 65+ products, in Abuja. Demo every Friday.',
		},
		'/about': {
			title: 'Mentored by Builders, Not Instructors | Swizel Campus',
			description:
				'Skip the theory. At Swizel Campus you are mentored by the core team behind 65+ live digital products. Meet the people, see the open day, and apply for a place.',
		},
		'/services': {
			title: 'The Six Departments of a Software Company | Swizel Campus',
			description:
				'Strategy, design, code, marketing, maintenance and AI: see how a product is built, launched and scaled, and the exact skills each department uses every day.',
		},
		'/portfolio': {
			title: 'Show & Tell: Products Built at Swizel | Swizel Campus',
			description:
				'Not classroom exercises. Real products, live on the internet, built by the team our interns learn beside. Click through the slides, then browse the cabinet.',
		},
		'/blog': {
			title: 'Notes for Learners & New Developers | Swizel Journal',
			description:
				'Plain-English pieces on getting into tech, learning to build, and what it is really like to ship software in Nigeria, written by the team doing it every day.',
		},
		'/contact': {
			title: 'Apply or Ask: The Swizel Campus Front Office',
			description:
				'Tell us what you want to build or learn. Four boxes, two minutes, and a real person at Swizel\'s Abuja front office replies within one working day.',
		},
	},
	// Studio: creatives and brands — the gallery
	studio: {
		'/': {
			title: 'Design Studio for Brands & Digital Products | Swizel Studio',
			description:
				'Brand identity, art direction, UI/UX, motion and web, by designers, engineers and storytellers building for the real world. Walk the collection, on view now.',
		},
		'/about': {
			title: 'The Makers Behind the Collection | Swizel Studio',
			description:
				'Portrait of the studio: one house of designers, engineers and growth marketers shipping since 2019. The people, the craft, and two minutes inside the residence.',
		},
		'/services': {
			title: 'Six Ateliers: Design, Build, Market & More | Swizel Studio',
			description:
				'Design, development, marketing, strategy, maintenance and education, practised under one roof by the same hands. Choose a door; every room is open.',
		},
		'/portfolio': {
			title: 'The Collection: Brand & Product Design Work | Swizel Studio',
			description:
				'Every work on the wall: brands you can buy from, apps you can download, platforms real businesses run on. Follow the spotlight or go straight to the wall.',
		},
		'/blog': {
			title: 'Essays on Design, Craft & Building | Swizel Journal',
			description:
				'Essays and build stories on design, brand, software and growth from the Swizel house, plus The Brevarium, our free magazine of featured work and thinking.',
		},
		'/contact': {
			title: 'Commission the Studio | Swizel Studio',
			description:
				'Write to the desk by phone, WhatsApp, email or in person at Lokogoma, Abuja. Sketches, voice notes and rough ideas welcome; a project manager reads every one.',
		},
	},
};

/** Is this clean path one of the six pages a world gets indexed on? */
export const isWorldPagePath = (clean: string): clean is WorldPagePath =>
	(WORLD_PAGE_PATHS as readonly string[]).includes(clean !== '/' ? clean.replace(/\/+$/, '') : '/');

/**
 * The title and description for `path` in `world`. Boardroom is the
 * clean page and keeps its record in src/data/seo.ts; the others have
 * their own words above.
 */
export function worldSeo(world: World, path: WorldPagePath): PageSeo {
	const base = PAGES[path];
	if (world === 'boardroom') return base;
	// The share image, kicker and keyword record stay the page's own; only
	// the words a search engine shows change.
	return { ...base, ...WORLD_SEO[world][path] };
}
