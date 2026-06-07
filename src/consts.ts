// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE =
  "Swizel Technologies Limited | Digital Solutions for Smart Businesses";

export const SITE_DESCRIPTION =
  "Swizel is an IT solution company with primary emphasis on harnessing web technologies to deliver solutions which aim at improving way of life and ease of doing business across all sectors of human life";

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

export const links = ["about", "services", "portfolio", "blog", "bootcamp"];

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
    icon: "mdi:briefcase-outline",
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
  {
    id: "legacy",
    name: "Swizel Legacy",
    audience: "the original swizel.co",
    blurb: "The classic Swizel experience you already know.",
    accent: "#428876",
    icon: "mdi:history",
  },
] as const;

export type ViewId = (typeof views)[number]["id"];
export const DEFAULT_VIEW: ViewId = "boardroom";

// Quiz: each option nudges the score toward one or more views.
export const viewQuiz = [
  {
    q: "What brings you to Swizel today?",
    options: [
      { label: "I'm building something technical", scores: { builder: 3 } },
      { label: "I run or grow a business", scores: { boardroom: 3 } },
      { label: "I'm a founder with an idea", scores: { founder: 3 } },
      { label: "I'm learning & leveling up", scores: { campus: 3 } },
      { label: "I care about design & brand", scores: { studio: 3 } },
    ],
  },
  {
    q: "What matters most to you?",
    options: [
      { label: "Speed to launch", scores: { founder: 2, builder: 1 } },
      { label: "Code quality & architecture", scores: { builder: 2 } },
      { label: "ROI & reliability", scores: { boardroom: 2 } },
      { label: "A beautiful experience", scores: { studio: 2 } },
      { label: "Growth & learning", scores: { campus: 2 } },
    ],
  },
  {
    q: "How do you like your information?",
    options: [
      { label: "Show me the code", scores: { builder: 2 } },
      { label: "Just the bottom line", scores: { boardroom: 2 } },
      { label: "Tell me with visuals", scores: { studio: 2 } },
      { label: "Fast and fun", scores: { campus: 2 } },
      { label: "The roadmap & milestones", scores: { founder: 2 } },
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
    role: "UI/UX designer",
    linkedinURL: "#",
    bio: "Achimi Dennis is a dedicated designer with a passion for creating seamless and impactful digital experiences. Specialising in user-centered design, He excels at transforming complex concepts into intuitive, user-friendly interfaces that achieve business goals and captivate users.",
    experience: [
      {
        company: "Raadaa partners international limited",
        jobDesc: "UI/UX designer",
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
      "We are always looking for bright and innovative minds at swizel, please contact us at info@swizel.co for information on vacancies and internship opportunities.",
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
      "Yes. we have a referral program that guarantees bonuses for bringing in paying clients, you can contact us via contact@swizel.co or WhatsApp us at +234 8140 833 014",
  },
  {
    question:
      "I want to move my business or tech support to Nigeria, do you offer such a service?",
    answer:
      "Yes. We are certain our well-rounded team will fulfill all your support and transition needs. We will also help with compliance and great insight into the Nigerian business space. Please  contact us via contact@swizel.co or WhatsApp us at +234 8140 833 014",
  },
  {
    question: "I have an idea I want to turn into a startup, can you help?",
    answer:
      "Yes. We will be your team and work with you to turn your ideas into real products and services. Contact us via contact@swizel.co or WhatsApp us at +234 8140 833 014 ",
  },
];

export const bootCampFaq: typeof faq = [
  {
    question: "Is it free ?",
    answer:
      "YES! our boot camp program is completely free however there's an affordable fee attached to the certification exam at the end of the program.",
  },
  {
    question: "How long is the program ?",
    answer:
      "3 months. You also have an additional 3 months of free mentorship and 3 months of paid internship if you qualify for the internship position.",
  },
  {
    question: "What do I learn ?",
    answer:
      "You will learn how to make beautiful websites, applications and fun games, beautiful designs, manage projects, manage ads, make websites easier to find and much more depending on the program you choose.",
  },
  {
    question: "Do I get a job after the program with your parent company?",
    answer:
      "The short answer is YES. You can qualify for a paid internship position if you meet our selection criteria from this particular program, we will also retain Interns for job positions if they perform satisfactorily.",
  },
  {
    question: "Is it an online program?",
    answer:
      "We have both virtual(Online) programs and a physical coaching program. schedules are flexible and will be set with your coaches/mentors. ",
  },
  {
    question: "Is the Webinar Free?",
    answer:
      "Yes. The webinar is free if you register. In the webinar, we will tell you all the cool stuff you will be doing on the program, plus you get to meet your coaches and fellow tech bros/sis' ",
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
