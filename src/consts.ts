// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

/**
 * The company, as it is registered and as it should be shown wherever a
 * NAME is wanted rather than a description: og:site_name, the schema
 * graph, the PWA install prompt. Keywords do not belong here — og:site_name
 * is printed above the title on LinkedIn and Facebook, and a keyword string
 * in that slot reads as spam.
 */
export const SITE_NAME = "Swizel Technologies Limited";

/**
 * What we do, in the words people actually type into Google. Used as the
 * default page <title>; individual pages override it from src/data/seo.ts.
 *
 * It replaced "Digital Solutions for Smart Businesses", which described
 * nothing and matched no search anyone has ever performed.
 */
export const SITE_TAGLINE =
  "Custom Website, Software and App Development Company";

export const SITE_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "Swizel Technologies Limited helps ambitious businesses anywhere turn bold ideas into products people love. We design, build, market and maintain software, from launch to legacy. 65+ products live across 10+ countries.";

// ── What we stand for ──────────────────────────────────────────────────
// One source of truth. Every About world (Boardroom, Founder, Builder,
// Campus, Studio) reads these, so the wording can never drift apart again.

export const MISSION =
  "To help ambitious businesses anywhere turn bold ideas into products people love, from launch to legacy.";

export const MISSION_SUPPORT =
  "We design it, build it, take it to market and keep it running. One team, from the blank page to the product's tenth year.";

export const VISION =
  "A world where great products can come from anywhere, and thrive everywhere.";

/** Told in the order the work actually happens: build, ship, stay, teach. */
export const CORE_VALUES = [
  {
    name: "We build for the user",
    icon: "mdi:gesture-tap",
    desc: "Zero to market, shaped around whoever actually uses it, not whoever signs for it.",
  },
  {
    name: "We ship when we said",
    icon: "mdi:clock-check-outline",
    desc: "A date is a date. 98% on time, and we count.",
  },
  {
    name: "We stay long after launch",
    icon: "mdi:hand-heart-outline",
    desc: "Launch day is the middle of the job. We market it, maintain it and keep it growing.",
  },
  {
    name: "We give away the playbook",
    icon: "mdi:book-open-variant",
    desc: "Knowledge should not sit in a silo. Open books, open mentorship, so no builder has to rely on luck.",
  },
] as const;

export const categorise = [
  "all",
  "branding",
  "software development",
  "UI/UX design",
  "marketing",
] as const;

export const breadCrumbDesc =
  "Work with a team of highly skilled engineers to build fast and scale while maintaining quality.";

export const portfolio = [
  {
    name: "brix marketplace",
    category: "UX Design, Web Development, Marketing and Maintenance",
    url: "/portfolio/brixmarketplace",
  },
  {
    name: "betslipswitch",
    category: "Web Development, Marketing, App",
    url: "/portfolio/betslipswitch",
  },
  {
    name: "hemamsynergy",
    category: "Web Development, Maintenance, Hosting",
    url: "/portfolio/hemamsynergy",
    src: "/projects/hemam-hero-frame.webp",
  },
  { name: "sarosgp", category: "Web Development, Maintenance", url: null },
  {
    name: "my eya estate",
    category: "Web Development, Maintenance",
    url: null,
  },
  {
    name: "beautyhive",
    src: "/images/portfolio/beauty-hive.webp",
    category: "Web Development, Maintenance",
    url: null,
  },
  {
    name: "purplepanda world",
    category: "Web Development, SEO",
    url: null,
  },
] as const;

export const links = ["about", "services", "portfolio", "blog", "programs"];

// ── Multi-view experience ────────────────────────────────────────────
// Same information, reframed for different audiences. The onboarding quiz
// recommends one; visitors can switch anytime.
export const views = [
  {
    id: "builder",
    name: "Builder",
    audience: "for developers & technical teams",
    blurb: "Code first. A live editor, the stack, the architecture.",
    accent: "#18debe",
    icon: "mdi:code-tags",
  },
  {
    id: "boardroom",
    name: "Boardroom",
    audience: "for executives and leaders",
    blurb: "Calm and premium. ROI, reliability and proof.",
    accent: "#28a6ec",
    icon: "mdi:diamond-stone",
  },
  {
    id: "founder",
    name: "Founder",
    audience: "for startup founders",
    blurb: "Zero to MVP. Momentum, speed and a clear roadmap.",
    accent: "#8b5cf6",
    icon: "mdi:rocket-launch-outline",
  },
  {
    id: "campus",
    name: "Campus",
    audience: "for students and new talent",
    blurb: "Bright and gamified. Learn, build, get hired.",
    accent: "#f59e0b",
    icon: "mdi:school-outline",
  },
  {
    id: "studio",
    name: "Studio",
    audience: "for creatives & brands",
    blurb: "Visual and editorial. Bold type, big imagery, real work.",
    accent: "#ec4899",
    icon: "mdi:palette-outline",
  },
] as const;

export type ViewId = (typeof views)[number]["id"];
export const DEFAULT_VIEW: ViewId = "boardroom";

// Quiz: two questions, each option nudges the score toward one or more views.
export const viewQuiz = [
  {
    q: "Who are you?",
    hint: "So we can speak your language.",
    options: [
      {
        label: "A business owner or executive",
        sub: "I make the decisions",
        icon: "mdi:chart-box-outline",
        scores: { boardroom: 3 },
      },
      {
        label: "A tech bro / sis",
        sub: "Developer, engineer, technical lead",
        icon: "mdi:code-tags",
        scores: { builder: 3 },
      },
      {
        label: "A founder with an idea",
        sub: "Early stage, big plans",
        icon: "mdi:rocket-launch-outline",
        scores: { founder: 3 },
      },
      {
        label: "A student or career switcher",
        sub: "Learning, growing, job-hunting",
        icon: "mdi:school-outline",
        scores: { campus: 3 },
      },
      {
        label: "A creative or brand person",
        sub: "Design, content, marketing",
        icon: "mdi:palette-outline",
        scores: { studio: 3 },
      },
      {
        label: "Just looking around",
        sub: "Show me your best",
        icon: "mdi:compass-outline",
        scores: { boardroom: 1 },
      },
    ],
  },
  {
    q: "What do you want?",
    hint: "Pick the closest one. You can explore everything after.",
    options: [
      {
        label: "Build a product or app",
        sub: "From idea to launch",
        icon: "mdi:hammer-wrench",
        scores: { founder: 2, builder: 1 },
      },
      {
        label: "Grow or modernize my business",
        sub: "Software that pays for itself",
        icon: "mdi:trending-up",
        scores: { boardroom: 2 },
      },
      {
        label: "A technical team I can trust",
        sub: "Engineering, architecture, code",
        icon: "mdi:source-branch",
        scores: { builder: 2, boardroom: 1 },
      },
      {
        label: "Design, branding or content",
        sub: "Make my brand beautiful",
        icon: "mdi:brush-variant",
        scores: { studio: 2 },
      },
      {
        label: "Learn tech skills & get hired",
        sub: "Internships and NYSC placement",
        icon: "mdi:book-open-variant",
        scores: { campus: 3 },
      },
      {
        label: "See your work & story first",
        sub: "Proof before promises",
        icon: "mdi:eye-outline",
        scores: { boardroom: 1, studio: 1 },
      },
    ],
  },
] as const;

export const formatWord = (camelCase: string) =>
  camelCase
    .replace(/\s/g, "")
    .replace(/([A-Z])/g, (match) => ` ${match}`)
    .replace(/([_])/g, (_) => ` `)
    .trim()
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

export const teamDetails = [
  /* {
		name: 'Princewill',
		role: 'Media & Marketing',
		linkedinURL: '#',
		bio: 'Princewill Iwu is an experienced and corporate intellectual, with a very high degree of business acumen, a great team player with an excellent spoken and written communication skill, his creativity and open-minded approach towards problem solving always leads to innovative solutions to critical issues.',
		experience: [
			{
				company: 'Gumaling ',
				jobDesc: 'Business Development Manager',
			},
			{
				company: 'Sage ',
				jobDesc: 'Head of Media and Marketing',
			},
		],
	}, */
  {
    name: "Ruke",
    role: "Product Manager",
    linkedinURL: "#",
    bio: "Ruke Aror is a talented designer with a knack for problem solving. Her approach to every project is user first with a keen interest in mobile UX design, micro-interactions and UX research. Her passion and drive results in a time-tested consistency in the superior quality of her work.",
    experience: [
      {
        company: "Taxaide ",
        jobDesc: "Product Designer",
      },
      {
        company: "Alps Finance ",
        jobDesc: "UI/UX Designer",
      },
    ],
  },
  {
    name: "Nathaniel",
    role: "Frontend Developer",
    linkedinURL: "#",
    bio: "Nathaniel Godspower is a skilled Frontend Developer who specialized in React. He has over 5 years of experience in building interactive user interfaces. He is passionate about solving complex problems and training the next generation of developers.",
    experience: [
      {
        company: "BaseAfrique",
        jobDesc: "Frontend Engineer, React",
      },
      {
        company: "IgrowAfrika",
        jobDesc: "Frontend Engineer, React",
      },
      {
        company: "Iceztech, Awka",
        jobDesc: "Developer, Intern",
      },
    ],
  },
  {
    name: "Precious",
    role: "Mobile Developer",
    linkedinURL: "#",
    bio: "Precious Chiemerie Okafor is a software engineer with hands on experience in all levels of mobile development including design, development, testing and deployment. He has over 4 years of experience in Mobile Development and is vast in Flutter, Dart, Java, Firebase, Native Android and IOS Development.",
    experience: [
      {
        company: "Jithvar Consultancy",
        jobDesc: "Mobile developer",
      },
      {
        company: "Flaux Movies",
        jobDesc: "Mobile developer",
      },
      {
        company: "Upwork",
        jobDesc: "Freelance Mobile developer",
      },
    ],
  },
  {
    name: "Mary",
    role: "Software Engineer",
    linkedinURL: "https://www.linkedin.com/in/marybngozi/",
    bio: "Mary Blessing Umeh is a software Engineer with customer-driven nature, organised and collaborative team player with strong communication and analytical abilities. Dedicated to improving skills through hands-on learning and development work. With more than 3 years of professional experience in software development for the web (full-stack) and an intermediate experience in hybrid mobile and desktop applications",
    experience: [
      {
        company: "AppMart",
        jobDesc: "Software Engineer",
      },
      {
        company: "Insurepass",
        jobDesc: "Software Engineer - Frontend",
      },
      {
        company: "Udacity",
        jobDesc: "External Contractor - Session Lead / Mentor",
      },
    ],
  },
  {
    name: "Stephen",
    role: "Fullstack Developer",
    linkedinURL: "#",
    bio: "Stephen Agbo is a highly skilled and adept Software Engineer with vast experience in building optimized software products that can seamlessly serve millions of users. He is adept in IOS, Android, and Web Applications. He is an team player with great problem solving and analytical skills.",
    experience: [
      {
        company: "Iceztech, Awka",
        jobDesc: "Senior Software Engineer",
      },
      {
        company: "Webmack Technologies",
        jobDesc: "Mobile developer",
      },
      {
        company: "Mobile Developer",
        jobDesc: "Lead Mobile Engineer",
      },
    ],
  },
  {
    name: "Azoro",
    role: "Business Development Lead",
    linkedinURL: "#",
    bio: "Azoro Chibueze is an experienced, and a commercially aware young professional, with vast experience in business management across different sectors, Agriculture, Technology, Real Estate, and Consulting. He holds a Master’s Degree from one of the most reputable schools in Europe, and serves as the company’s Head of Business Development.",
    experience: [
      {
        company: "Aham Rochas Group",
        jobDesc: "Manager (Special Projects)",
      },
      {
        company: "Sahel Capital Agribusiness Mgmt",
        jobDesc: "Data & Business Analyst",
      },
      {
        company: "Uniki Global Logistcs",
        jobDesc: "Business Development Manager",
      },
    ],
  },
  {
    name: "Dennis",
    role: "UI/UX & Graphics Designer",
    linkedinURL: "#",
    // Rewritten from his own CV (Sept 2026). The old copy was the kind of
    // thing that could describe any designer anywhere — "transforming
    // complex concepts into intuitive interfaces" — and named one past
    // employer. This says what he has actually drawn, which is more
    // persuasive and happens to include the work now on the home page.
    bio: "Achimi Dennis Ojodomo is a UI/UX and graphics designer with a Bachelor of Engineering in Computer Engineering from Covenant University. He designed TellaTrust and Nicetel, two fintech products for paying bills; Kribbs, a proptech platform matching house-hunters with owners and with space-sharing built in; and BetsConvert, which turns a bet code from one bookmaker into another's. He works in Figma from research and wireframes through to prototypes, and has shipped across proptech, AI, recruitment and e-commerce.",
    experience: [
      {
        company: "Swizel Technologies",
        jobDesc: "UI/UX & Graphics Designer",
      },
      {
        company: "Blu Horizon LLP",
        jobDesc: "UI/UX & Graphics Designer",
      },
      {
        company: "Raadaa Partners Limited",
        jobDesc: "UI/UX Design Intern",
      },
    ],
  },
  {
    name: "Linda",
    role: "Marketing Lead",
    linkedinURL: "#",
    bio: "Linda is a skilled Graduate Engineer with a B.Eng in Electronics and Computer Engineering from Nnamdi Azikiwe University and a National Diploma in Computer Engineering from Federal Polytechnic, Oko. Her experience includes roles such as Revenue Officer at Anambra State Revenue Services, IT Support Staff at the Ministry of Tertiary Education, and Virtual Assistant & Administrative Manager at Nwakonuche Group. In these positions, Linda effectively managed revenue collection, provided IT support, and streamlined administrative processes. Proficient in MS Office, Google Workspace, Unix Shell Programming, and full stack web development, Linda is known for her integrity, strong communication skills, and ability to work both independently and collaboratively. She has completed certifications from the Nigeria Society of Engineers, ALX Software Engineering Programme, and Coursera. Linda is a motivated professional eager to contribute to innovative projects and drive success in her future endeavours.",
    experience: [
      {
        company: "Revenue Officer",
        jobDesc: "Anambra State Revenue Services",
      },
      {
        company: "IT Support Staff",
        jobDesc: "Ministry of Tertiary Education",
      },
      {
        company: "Virtual Assistant & Administrative Manager",
        jobDesc: "Nwakonuche Group",
      },
    ],
  },
] as const;

export const contactFormDetails = [
  {
    label: "What is your name?",
    placeholder: "Your full name",
    isRequired: true,
    name: "name",
  },
  {
    label: "What is your email address?",
    placeholder: "Your email address",
    isRequired: true,
    name: "email",
    type: "email",
  },
  {
    label: "What is your phone number? (optional)",
    placeholder: "Your phone number",
    isRequired: false,
    name: "phoneNumber",
  },
  {
    label: "Type a message",
    placeholder: "Tell us about your company or project.",
    as: "textarea",
    rows: 4,
    isRequired: true,
    name: "message",
  },
] as const;

type ContactFormKeys = typeof contactFormDetails;

export type ContactFormData = {
  [key in ContactFormKeys[number]["name"]]: string;
};

export const formatLink = (str: string) =>
  str.replace(/[_-]|([a-z])([A-Z])/g, (_, match1, match2) =>
    match1 ? " " + match1.toLowerCase() + match2.toLowerCase() : " "
  );

export const faq = [
  {
    question: "How much does it cost to create a website?",
    answer:
      "Our pricing systems are very fair and depend on the type of website you want and your goals and needs, please contact our project manager to get a quote here.",
  },
  {
    question: "How do I join the swizel team?",
    answer:
      "We are always looking for bright and innovative minds at swizel, please write to career@swizel.co for vacancies and internship opportunities.",
  },
  {
    question: "I want to learn to code, how do I start?",
    answer:
      "You can join our boot camp program, click here to start your journey in tech.",
  },
  {
    question:
      "I own a small business and have little money, can I still get a website?",
    answer:
      "Yes. you can check on our small business plan and see if you qualify",
  },
  {
    question: "Do I get an incentive for referring jobs to Swizel?",
    answer:
      "Yes. we have a referral program that guarantees bonuses for bringing in paying clients, you can contact us via contact@swizel.co or WhatsApp us at +234 810 020 4570",
  },
  {
    question:
      "I want to move my business or tech support to Nigeria, do you offer such a service?",
    answer:
      "Yes. We are certain our well-rounded team will fulfill all your support and transition needs. We will also help with compliance and great insight into the Nigerian business space. Please  contact us via contact@swizel.co or WhatsApp us at +234 810 020 4570",
  },
  {
    question: "I have an idea I want to turn into a startup, can you help?",
    answer:
      "Yes. We will be your team and work with you to turn your ideas into real products and services. Contact us via contact@swizel.co or WhatsApp us at +234 810 020 4570 ",
  },
];

export const bootCampFaq: typeof faq = [
  {
    question: "Is this the old free bootcamp?",
    answer:
      "No. We no longer run the open bootcamp. There are two ways in now: an IT / SIWES internship, or your NYSC service year with us. Both are applied for, and both are selective.",
  },
  {
    question: "Why is it selective?",
    answer:
      "Because you are put on a live client project, not a practice exercise. Real deadlines and real users mean we can only take a small cohort each intake, so the application has to be strong.",
  },
  {
    question: "How long is it?",
    answer:
      "The internship runs to your school's requirement, so three or six months depending on your institution. The NYSC placement runs the full service year.",
  },
  {
    question: "What will I be doing?",
    answer:
      "Shipping. You join a squad building websites, web and mobile applications, designs, or growth campaigns for paying clients, with a mentor reviewing your work the whole way.",
  },
  {
    question: "Is there a fee?",
    answer:
      "There is no tuition. This is a placement, not a course. Interns who perform are considered for paid roles, and NYSC members are placed on the normal service terms.",
  },
  {
    question: "Do I need experience already?",
    answer:
      "You need enough to show us you can build something, however small. A portfolio, a repository, a design file, a campaign you ran. What we look for is evidence that you finish things.",
  },
  {
    question: "Can I do it remotely?",
    answer:
      "Some squads run remote and some run from the Abuja office. Tell us which you need in your application and we will be straight with you about what is available.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "We review every application. If it is a fit you will hear from us for a short conversation and a small practical task, then a decision. We would rather say no quickly than leave you waiting.",
  },
];

export const isTrue = (str: string) => str === "true";

export const bootCampForm = [
  {
    label: "First name",
    placeholder: "Enter your first name",
    isRequired: true,
    name: "firstName",
  },
  {
    label: "Last name",
    placeholder: "Enter your last name",
    isRequired: true,
    name: "lastName",
  },
  {
    label: "Email address?",
    placeholder: "Enter your email address",
    isRequired: true,
    name: "email",
    type: "email",
  },
  {
    label: "Phone number?",
    placeholder: "Enter your phone number",
    isRequired: false,
    name: "phoneNumber",
    // pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}',
    type: "tel",
  },
  /* {
		label: 'Type a message',
		placeholder: 'Tell us about your company or project.',
		as: 'select',
		rows: 4,
		isRequired: true,
		name: 'message',
	},
	{
		label: 'Type a message',
		placeholder: 'Tell us about your company or project.',
		as: 'textarea',
		rows: 4,
		isRequired: true,
		name: 'message',
	}, */
] as const;

// ── Google tags ──────────────────────────────────────────────────────
// Committed rather than hidden in environment variables on purpose:
// every one of these is printed into the page source for any visitor to
// read, so none of them is a secret and treating them as secrets only
// adds a step to every deploy. PUBLIC_GA_ID overrides the first if the
// property ever changes without a code change.

/** The GA4 property for swizel.co. */
export const GA_ID = 'G-L6G0KQD6D1';

/**
 * The property the old site reported to. It was hardcoded into the head
 * and nobody mentioned it, so it is kept firing rather than quietly
 * dropped — its history stays continuous while the new property fills
 * up. Set to '' to retire it; nothing else needs changing.
 */
export const GA_LEGACY_ID = 'G-9CH1K4P5C8';

/** Google Ads, for conversion tracking on campaigns. */
export const ADS_ID = 'AW-11006297401';
