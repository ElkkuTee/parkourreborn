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
        'pr-dark': '#111827',
      },
    },
  },
  plugins: [],
}