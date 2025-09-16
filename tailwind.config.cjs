/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'pr-dark': '#0b0f12',
        'pr-neon': '#00bfff',
      },
    },
  },
  plugins: [],
};
