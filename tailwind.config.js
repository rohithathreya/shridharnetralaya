/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Kannada', 'system-ui', 'sans-serif'],
        kannada: ['Noto Sans Kannada', 'Inter', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        obsidian: {
          950: '#05080c',
          900: '#0a0f14',
          850: '#0e141b',
          800: '#131b24',
          700: '#1a2430',
          600: '#243040',
        },
        clinic: {
          50: '#e8f7f6',
          100: '#c5ebe9',
          200: '#8fd9d4',
          300: '#52c4bc',
          400: '#2daba1',
          500: '#1d948a',
          600: '#177870',
          700: '#155f59',
          800: '#144d48',
          900: '#13403c',
        },
        gold: {
          300: '#e8d4b0',
          400: '#d9bc86',
          500: '#c9a05c',
          600: '#a8843f',
        },
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(45, 171, 161, 0.35)',
        card: '0 16px 48px -12px rgba(0, 0, 0, 0.55)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45, 171, 161, 0.18), transparent)',
        'mesh-dark':
          'radial-gradient(at 20% 20%, rgba(201, 160, 92, 0.06) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(45, 171, 161, 0.1) 0, transparent 45%)',
      },
    },
  },
  plugins: [],
};