/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// --- Existing brand tokens (kept for backwards compatibility) ---
				swizelDark: '#28293E',
				swizelGreen: '#428876',
				textLight: '#ffffffa3',
				swizelBrown: '#F3D1BF',
				darker: '#302C29',
				'darker-alt': '#302C29',

				// --- New consistent design-token palette ---
				// Deep navy surface used across dark sections.
				brand: {
					DEFAULT: '#28293E',
					50: '#f4f5f8',
					100: '#e3e4ec',
					200: '#c3c5d6',
					300: '#9a9db6',
					400: '#6f7291',
					500: '#4c4f70',
					600: '#3a3c58',
					700: '#2f3047',
					800: '#28293E',
					900: '#1d1e2e',
					950: '#121320',
				},
				// Teal/cyan accent (matches the hero gradient).
				accent: {
					DEFAULT: '#18debe',
					light: '#86E2EF',
					mint: '#8dfeea',
					teal: '#18debe',
					blue: '#28a6ec',
					deep: '#0fb89c',
				},
			},
			fontWeight: {
				bolder: 900,
			},
			fontFamily: {
				bebas: ['Bebas Neue', 'sans-serif'],
				sans: ['Epilogue', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			// Consistent type scale for headings/body across all pages.
			fontSize: {
				'display-lg': ['clamp(3rem, 6vw, 6rem)', { lineHeight: '1.05', letterSpacing: '0.5px' }],
				display: ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1' }],
				'heading-1': ['clamp(2rem, 4vw, 3.25rem)', { lineHeight: '1.15' }],
				'heading-2': ['clamp(1.6rem, 3vw, 2.5rem)', { lineHeight: '1.2' }],
				'heading-3': ['clamp(1.3rem, 2vw, 1.75rem)', { lineHeight: '1.3' }],
				lead: ['1.25rem', { lineHeight: '1.7' }],
			},
			maxWidth: {
				container: '1200px',
			},
			borderRadius: {
				xl2: '1.25rem',
			},
			boxShadow: {
				card: '0 10px 30px -12px rgba(40, 41, 62, 0.18)',
				'card-hover': '0 20px 45px -15px rgba(40, 41, 62, 0.28)',
			},
			transitionTimingFunction: {
				smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
			},
		},
	},
	plugins: [],
};
