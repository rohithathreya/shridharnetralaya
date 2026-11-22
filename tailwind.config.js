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
          950: '#f4efe7',
          900: '#fffcf8',
          800: '#efe7db',
          700: '#e4dacb',
        },
        ivory: {
          50: '#1c1712',
          100: '#2c261f',
          200: '#3f372e',
          300: '#52493e',
          400: '#6e6558',
          500: '#8d8476',
        },
        gold: {
          300: '#0f6e64',
          400: '#0c5c54',
          500: '#0a4a44',
          600: '#083833',
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
          600: '#0f5c56',
          700: '#0c4a45',
          800: '#083833',
          900: '#062824',
        },
      },
      boxShadow: {
        lift: '0 18px 50px -28px rgba(28, 23, 18, 0.45)',
        soft: '0 1px 0 rgba(255,255,255,0.7) inset, 0 10px 30px -18px rgba(28, 23, 18, 0.28)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
};
