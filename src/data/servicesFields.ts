const servicesFields = [
	{
		name: 'design',
		children: [
			{
				title: 'Brand Design',
				paragraph:
					'Our goal is to help you turn your business idea into a brand. Let us create your logos and find your brand voice.',
				listItem: ['Logo design', 'Brand Identity', 'Social media'],
			},
			{
				title: 'Product Design',
				paragraph:
					'If you have a product in mind, then let us turn that into an MVP. We will handle research, interface design, prototyping and all the steps in between.',
				listItem: [
					'User interface ',
					'Prototyping',
					'Usability testing',
				],
			},
		],
	},
	{
		name: 'development',
		children: [
			{
				title: 'Mobile Applications',
				paragraph:
					'We understand that mobile usability is the future so we take a mobile first approach to all our projects. Using the most up-to-date technologies and industry best practices, we will provide you with the most reliable products.',
				listItem: [
					'Flutter',
					'Native Android Development',
					'IOS Development',
					'Java',
				],
			},
			{
				title: 'Native Android Development',
				paragraph:
					'Every business starts with a web application. A fully functional product that can be accessed anywhere. We will go above and beyond to meet your expectations and maintain, update, and optimize your digital products as your business grows.',
				listItem: ['React', 'PHP', 'VUE JS', 'Python'],
			},
		],
	},
	{
		name: 'digital marketing',
		children: [
			{
				title: 'Social Media',
				paragraph:
					'Your business needs a social media presence and we are here to help you navigate that. We help businesses grow an audience online, run successful campaigns and boost engagement.',
				listItem: ['Facebook', 'Instagram', 'Youtube'],
			},
			{
				title: 'Search Engine',
				paragraph:
					'We help business achieve their goals through Search Engine Marketing. We run data-driven campaigns to deliver conversions, not clicks.',
				listItem: [
					'Content Marketing',
					'Search Engine Optimization',
					'Search Ads',
				],
			},
		],
	},
] as const;

export default servicesFields;
