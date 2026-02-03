export const profile = {
	fullName: 'Sebastian Reboul',
	title: 'PhD Student in Mathematics & Computer Science',
	institute: 'Wiremind Cargo / Télécom SudParis',
	author_name: 'Sebastian Reboul', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Reinforcement Learning', description: '', field: 'Research' },
		{ title: 'Combinatorial Optimization', description: '', field: 'Research' },
		{ title: '3D Bin Packing', description: '', field: 'Research' },
		{ title: 'Safe RL', description: '', field: 'Research' },
		{ title: 'Invalid Action Masking', description: '', field: 'Research' },
	],
}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'sebastian.reboul@gmail.com',
	linkedin: '',
	x: 'https://www.x.com/',
	bluesky: '',
	github: '',
	gitlab: '',
	scholar: '',
	inspire: '',
	arxiv: '',
	orcid: '',
}

export const template = {
	website_url: 'https://Hata41.github.io', // Astro needs to know your site’s deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	lightTheme: 'light', // Select one of the Daisy UI Themes or create your own
	darkTheme: 'dark', // Select one of the Daisy UI Themes or create your own
	excerptLength: 200,
	postPerPage: 5,
    base: import.meta.env.PROD ? '/personal-page' : '' // TODO: Replace '/personal-page' with your actual GitHub repository name (e.g., '/my-repo-name'). For user sites (username.github.io), set to ''.
}

export const seo = {
	default_title: 'Astro Academia',
	default_description: 'I am a CIFRE PhD student at Wiremind Cargo and Télécom SudParis, conducting research on Reinforcement Learning applied to Combinatorial Optimization, specifically the 3D Bin Packing Problem. I hold a Double Master in Mathematics and Computer Science from Sorbonne University.',
	default_image: '/images/astro-academia.png',
}
