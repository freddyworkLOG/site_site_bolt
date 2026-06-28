/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'hidden',
    'flex',
    'md:hidden',
    'md:flex',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
