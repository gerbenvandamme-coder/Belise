/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1C1917',
        blush: '#E8D5CE',
        taupe: '#D4B8A5',
        canvas: '#FAF7F2',
        card: '#FFFFFF',
        // Accentkleur "rosewood": DEFAULT voor vlakken en iconen, dark voor tekst, soft voor tinten.
        accent: {
          DEFAULT: '#A34D63',
          dark: '#7E3347',
          soft: '#F3DCE2',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        headline: ['var(--font-headline)', 'Georgia', 'serif'],
        script: ['var(--font-script)', 'cursive'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};