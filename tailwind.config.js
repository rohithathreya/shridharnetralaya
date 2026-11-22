/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'Noto Sans Kannada', 'system-ui', 'sans-serif'],
        kannada: ['Noto Sans Kannada', 'Figtree', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          950: '#f6f1e9',
          900: '#fffcf8',
          850: '#f3eee5',
          800: '#ece5d8',
          700: '#ddd5c6',
          600: '#cfc5b3',
        },
        ivory: {
          50: '#1a1510',
          100: '#29231b',
          200: '#3b332a',
          300: '#50463b',
          400: '#706556',
          500: '#928778',
        },
        gold: {
          300: '#0e7e73',
          400: '#0b6b62',
          500: '#095a52',
          600: '#074a43',
        },
        obsidian: {
          950: '#f7f3ec',
          900: '#fffdf9',
          850: '#f3eee6',
          800: '#efe7db',
          700: '#e4dacb',
          600: '#d8ccba',
        },
        clinic: {
          50: '#eef7f5',
          100: '#d7efe9',
          200: '#b3dfd6',
          300: '#7ec4b6',
          400: '#3d9a8c',
          500: '#1f7a6e',
          600: '#0e6b62',
          700: '#0b5750',
          800: '#084540',
          900: '#063530',
        },
      },
      boxShadow: {
        lift: '0 18px 50px -28px rgba(26, 21, 16, 0.4)',
        soft: '0 1px 0 rgba(255,255,255,0.65) inset, 0 8px 24px -14px rgba(26, 21, 16, 0.22)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
};
