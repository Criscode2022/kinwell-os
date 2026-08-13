/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        linen: { DEFAULT: '#f4efe4', 50: '#fbf8f2', 100: '#f4efe4', 200: '#e6dcc8' },
        ink: {
          50: '#f5f2ec', 100: '#e8e2d6', 200: '#d0c6b2', 300: '#b3a48c',
          400: '#8a7b66', 500: '#6c5e4c', 600: '#524738', 700: '#3b3328',
          800: '#272119', 900: '#1a1611', 950: '#100e0a',
        },
        bottle: {
          50: '#eef5f2', 100: '#d4e8e0', 200: '#a8d0c2', 400: '#4a9078',
          500: '#2a6b56', 600: '#1a4336', 700: '#14352b', 800: '#0f2820',
        },
        brass: { 400: '#d4b46a', 500: '#c4a35a', 600: '#a3843d', 700: '#7a632c' },
        rose: { 400: '#d9897a', 500: '#c45c4a', 600: '#a34434' },
      },
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,22,17,0.04), 0 12px 32px rgba(26,22,17,0.06)',
        soft: '0 10px 40px rgba(26,22,17,0.08)',
      },
    },
  },
  plugins: [],
};
