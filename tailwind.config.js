/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Kannada', 'system-ui', 'sans-serif'],
        kannada: ['Noto Sans Kannada', 'Inter', 'sans-serif'],
      },
      colors: {
        clinic: {
          50: '#f0f7f7',
          100: '#d7ecec',
          200: '#b0d9da',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#0b3634',
        },
      },
    },
  },
  plugins: [],
};
