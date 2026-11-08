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
        // Accent blush: DEFAULT voor vlakken en iconen, dark voor tekst en hover, soft voor tinten.
        accent: {
          DEFAULT: '#B03A5B',
          dark: '#7E3347',
          soft: '#F7E3E9',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};