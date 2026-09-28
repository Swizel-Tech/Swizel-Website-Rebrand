// One set of rules for every form on the site.
//
// The rules were written three times — once in the shared contact form,
// once on the campus contact sheet, once on the programs application —
// and the three did not agree. The shared form was the loosest of them:
// a name only had to be three characters long, so "123" went through,
// and a phone number was not checked at all.
//
// Everything below is the single source. Each check returns either null
// (fine) or the sentence to show the person, written the way a person
// would say it rather than "Invalid input".

/** Letters, and the punctuation that turns up inside real names. */
const NAMEISH = /^[A-Za-zÀ-ÿ'’.\-\s]+$/;

/** The address shapes a mail server will actually accept. */
const EMAILISH = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Domains people mistype for the big four, and what they meant. */
const TYPOS: Record<string, string> = {
	'gmail.co': 'gmail.com',
	'gmial.com': 'gmail.com',
	'gmai.com': 'gmail.com',
	'gmail.cm': 'gmail.com',
	'gmail.con': 'gmail.com',
	'gnail.com': 'gmail.com',
	'yahoo.co': 'yahoo.com',
	'yaho.com': 'yahoo.com',
	'yahooo.com': 'yahoo.com',
	'hotmai.com': 'hotmail.com',
	'hotmial.com': 'hotmail.com',
	'outlok.com': 'outlook.com',
	'outloo.com': 'outlook.com',
	'iclould.com': 'icloud.com',
	'icloud.co': 'icloud.com',
};

/** Words that are a placeholder rather than an answer. */
const JUNK = new Set([
	'test', 'testing', 'asdf', 'asdfasdf', 'qwerty', 'abc', 'abcd', 'xxx',
	'none', 'na', 'n/a', 'nil', 'nothing', 'anything', 'whatever', 'hello',
	'hi', 'hey', 'yes', 'no', 'ok', 'okay',
]);

const squash = (v: string) => v.trim().replace(/\s+/g, ' ');
const words = (v: string) => squash(v).split(' ').filter(Boolean);
/** true when a string is one character typed over and over ("aaaaaa"). */
const oneCharOver = (v: string) => {
	const bare = v.replace(/\s/g, '');
	return bare.length > 2 && new Set(bare.toLowerCase()).size === 1;
};

export interface NameOpts {
	/** ask for a first name and a surname, not just one word */
	full?: boolean;
	label?: string;
}

/**
 * A name has to be letters. This is the check the shared contact form
 * never had — "123" satisfied a three-character minimum perfectly well.
 */
export function checkName(raw: string, opts: NameOpts = {}): string | null {
	const v = squash(raw);
	const what = opts.label ?? 'name';
	if (!v) return `Please tell us your ${what}.`;
	if (/\d/.test(v)) return `A ${what} in letters, please — no digits.`;
	if (!NAMEISH.test(v)) return `Letters only for your ${what}, please.`;
	if (v.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 2) return `That ${what} looks too short.`;
	if (oneCharOver(v)) return `That does not look like a ${what}.`;
	if (JUNK.has(v.toLowerCase())) return `Your real ${what}, please — we do write back.`;
	if (opts.full && words(v).length < 2) return 'First name and surname, please.';
	if (v.length > 80) return `That ${what} is longer than we can store.`;
	return null;
}

/**
 * An address that will actually reach them, with a nudge when the domain
 * is one keystroke off a common one — far more useful than "invalid".
 */
export function checkEmail(raw: string): string | null {
	const v = raw.trim();
	if (!v) return 'Please give us an email address.';
	if (/\s/.test(v)) return 'An email address cannot contain a space.';
	if (!EMAILISH.test(v)) return 'That email address will not reach you.';
	if (v.includes('..')) return 'That email address has two dots in a row.';
	const [, domain = ''] = v.toLowerCase().split('@');
	if (domain.startsWith('.') || domain.endsWith('.')) return 'That email address will not reach you.';
	const tld = domain.split('.').pop() ?? '';
	if (tld.length < 2 || /\d/.test(tld)) return 'That email address will not reach you.';
	const meant = TYPOS[domain];
	if (meant) return `Did you mean @${meant}?`;
	if (v.length > 254) return 'That email address is longer than the standard allows.';
	return null;
}

/**
 * Phones vary far too much between countries to pattern-match properly,
 * so this counts digits and allows the punctuation people actually type.
 */
export function checkPhone(raw: string, required = false): string | null {
	const v = raw.trim();
	if (!v) return required ? 'Please give us a number we can call.' : null;
	if (!/^[+]?[\d\s()\-.]+$/.test(v)) return 'A phone number should be digits, and + ( ) - if you like.';
	const digits = (v.match(/\d/g) || []).length;
	if (digits < 7) return 'That number looks too short to ring.';
	if (digits > 15) return 'That number is longer than any country uses.';
	return null;
}

export interface TextOpts {
	minWords?: number;
	maxChars?: number;
	label?: string;
}

/**
 * The long boxes: a message, a brief, what you built. Counted in words
 * rather than characters, because five characters was passing for a
 * message and "hi" is not a brief.
 */
export function checkMessage(raw: string, opts: TextOpts = {}): string | null {
	const v = squash(raw);
	const min = opts.minWords ?? 5;
	const what = opts.label ?? 'message';
	if (!v) return `Please write us a ${what}.`;
	if (oneCharOver(v)) return `That ${what} is one character over and over.`;
	if (JUNK.has(v.toLowerCase())) return `A real ${what}, please — a sentence is plenty.`;
	const n = words(v).length;
	if (n < min) {
		return min <= 5
			? `A few more words, so we can actually help.`
			: `A little more, please — ${min} words or so.`;
	}
	if (opts.maxChars && v.length > opts.maxChars) {
		return `That is longer than we can send. Trim it to about ${opts.maxChars} characters.`;
	}
	return null;
}

/** Short free-text answers: institution, course, a job title. */
export function checkWords(raw: string, opts: TextOpts = {}): string | null {
	const v = squash(raw);
	const what = opts.label ?? 'answer';
	if (!v) return `Please fill in your ${what}.`;
	if (!/[A-Za-zÀ-ÿ]/.test(v)) return `Your ${what} should be words, not just numbers.`;
	if (v.length < 3) return `That ${what} looks too short.`;
	if (oneCharOver(v)) return `That does not look like a real ${what}.`;
	return null;
}

/**
 * The honeypot every form carries: a field no human can see. Anything in
 * it means a machine filled the form in, and the right answer is to say
 * nothing at all and drop it silently.
 */
export function looksAutomated(form: HTMLFormElement): boolean {
	const pot = form.querySelector<HTMLInputElement>('input[name="bot-field"], input[name="_gotcha"]');
	return !!pot && pot.value.trim() !== '';
}

/** Everything the site asks for, in one place, so no form can drift. */
export const rules = {
	name: (v: string) => checkName(v),
	fullName: (v: string) => checkName(v, { full: true, label: 'full name' }),
	email: checkEmail,
	phone: (v: string) => checkPhone(v, false),
	phoneRequired: (v: string) => checkPhone(v, true),
	message: (v: string) => checkMessage(v, { minWords: 5, maxChars: 4000 }),
	brief: (v: string) => checkMessage(v, { minWords: 12, maxChars: 4000 }),
};
