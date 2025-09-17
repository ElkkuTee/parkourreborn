/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pr-neon': 'rgb(var(--pr-neon) / <alpha-value>)',
        'pr-dark-lighter': '#1a1a1a',
        'pr-dark': '#111827',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}