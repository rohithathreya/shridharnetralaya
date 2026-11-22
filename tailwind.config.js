/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Noto Sans Kannada', 'system-ui', 'sans-serif'],
        kannada: ['Noto Sans Kannada', 'Outfit', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          950: '#090909',
          900: '#111111',
          800: '#1a1a1a',
          700: '#242424',
        },
        ivory: {
          50: '#f7f4ee',
          100: '#efeae1',
          300: '#d8d0c4',
          500: '#a39b90',
        },
        gold: {
          300: '#e4d2b4',
          400: '#c9ae86',
          500: '#b8956a',
          600: '#8f7048',
        },
        // Keep clinic tokens so existing staff screens stay readable.
        obsidian: {
          950: '#090909',
          900: '#111111',
          850: '#141414',
          800: '#1a1a1a',
          700: '#242424',
          600: '#2e2e2e',
        },
        clinic: {
          50: '#f7f4ee',
          100: '#efeae1',
          200: '#d8d0c4',
          300: '#c9ae86',
          400: '#b8956a',
          500: '#a68455',
          600: '#8f7048',
          700: '#6f5636',
          800: '#4d3c26',
          900: '#2c2418',
        },
      },
      letterSpacing: {
        brand: '0.28em',
      },
    },
  },
  plugins: [],
};
