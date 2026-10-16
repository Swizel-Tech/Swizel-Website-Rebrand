// The home page's title and description per world.
//
// The clean address (/) is Boardroom and carries the page's real SEO
// record. The /v/<world>/ versions are what a shared link points at, so
// each gets a card that says which world it opens — the same words the
// old /v/<world> share endpoints used.
import { PAGES } from '../../data/seo';
import { views } from '../../consts';
import type { World } from '../worlds';

const PITCH: Record<string, string> = {
	boardroom:
		'The same company, told for executives: return on investment, reliability, and proof you can take to a board.',
	builder:
		'The same company, told for engineers: the stack, the architecture and the code, first.',
	founder:
		'The same company, told for founders: zero to MVP, momentum, and a roadmap you can actually fund.',
	campus:
		'The same company, told for students: learn, build, and get hired, with internships and NYSC placement.',
	studio:
		'The same company, told for creatives: bold type, big imagery and the work itself.',
};

export function homeSeo(world: World) {
	const base = PAGES['/'];
	// The tab title, the meta description and the search snippet are the
	// real ones in every world — the page IS the home page. Only the
	// preview card of a shared /v/<world>/ link names the world, so the
	// person who receives it knows what they are opening.
	const v = views.find((x) => x.id === world);
	return {
		title: base.title,
		description: base.description,
		shareTitle: world === 'boardroom' ? undefined : `Swizel in ${v?.name ?? world} view`,
		shareDescription: world === 'boardroom' ? undefined : PITCH[world] ?? v?.blurb,
	};
}
