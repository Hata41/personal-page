import type { Education, Experience, Publication, Skill } from '@/types/cv';

export const education: Education[] = [
	{
		school: 'Wiremind Cargo (CIFRE), Télécom SudParis',
		time: 'May 2024 – Present',
		degree: 'PhD Student',
		location: '',
		description:
			"Subject: Reinforcement Learning for Combinatorial Optimization (3D-Bin Packing). Awarded 1st Prize at the 8th SAMOVAR PhD Student Day (Feb 2026) for the presentation 'Learning Upper-Lower Value Envelopes to Shape Online Reinforcement Learning' (<a href='https://samovar.telecom-sudparis.eu/index.php/2026/02/20/resultat-prix-doctorant-2026/' target='_blank' rel='noopener noreferrer' class='underline hover:text-blue-500'>details</a>).",
	},
	{
		school: 'Sorbonne University',
		time: '2021–2023',
		degree: 'Double Master in Mathematics and Computer Science',
		location: 'Paris',
		description: '',
	},
	{
		school: 'Sorbonne University',
		time: '2019–2021',
		degree: 'License in Mathematics',
		location: 'Paris',
		description: '',
	},
	{
		school: 'Lycée Fenelon',
		time: '2017–2019',
		degree: 'CPGE MPSI/MP*',
		location: 'Paris',
		description: '',
	},
];

export const experience: Experience[] = [
	{
		company: 'SAMOVAR Laboratory Council',
		time: '2024 – Present',
		title: 'Elected Representative for PhD Students (Substitute)',
		location: 'Télécom SudParis',
		description:
			"Serving as a substitute representative (suppléant) for the PhD students (Collège D) assisting in the operational management of the laboratory (<a href='https://samovar.telecom-sudparis.eu/index.php/le-conseil-de-laboratoire/' target='_blank' rel='noopener noreferrer' class='underline hover:text-blue-500'>lab council</a>).",
	},
];

export const skills: Skill[] = [
	{
		title: 'Programming',
		description: 'Reinfrocment learning algorithm implementation in pytohn and rust',
	},
	{
		title: 'Languages',
		description: 'English (Bilingual/Mother tongue), French, Italian (B1).',
	},
];

export const publications: Publication[] = [
	{
		title: 'Learning Upper Lower Value Envelopes to Shape Online RL: A Principled Approach',
		authors: 'Sebastian Reboul, Hélène Halconruy, Randal Douc',
		journal: 'arXiv',
		time: '2025',
		link: 'https://www.arxiv.org/abs/2510.19528',
		abstract: '',
	},
];
