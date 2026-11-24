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
          950: '#FBF9F6', // Crisp warm alabaster canvas
          900: '#FFFFFF', // Pure elevated surface
          850: '#F4EFE8', // Warm linen tint
          800: '#EBE4DA', // Soft oat
          700: '#DFD5C7', // Sand divider
          600: '#CCC0AE', // Stone border
        },
        ivory: {
          50: '#161412',  // Deep obsidian-espresso primary ink
          100: '#25211D', // Rich charcoal
          200: '#3B342E', // Deep umber
          300: '#574E45', // Body muted ink
          400: '#786D63', // Secondary label
          500: '#9B8F83', // Subtle hint
        },
        gold: {
          200: '#E8C9A2',
          300: '#D49B5E', // Luminous warm amber
          400: '#B57636', // Signature burnished bronze
          500: '#965D24', // Deep bronze interactive
          600: '#784819', // Rich umber bronze
        },
        clinic: {
          50: '#F7F1E8',
          100: '#EFE3D3',
          200: '#DFCCB3',
          300: '#C8AD8B',
          400: '#A9845B',
          500: '#965D24',
          600: '#784819',
          700: '#5B3512',
          800: '#42250B',
          900: '#2A1705',
        },
      },
      boxShadow: {
        lift: '0 22px 48px -24px rgba(22, 20, 18, 0.28)',
        soft: '0 1px 2px rgba(22, 20, 18, 0.04), 0 8px 24px -16px rgba(22, 20, 18, 0.12)',
        dock: '0 16px 40px -12px rgba(22, 20, 18, 0.32)',
      },
      letterSpacing: {
        brand: '0.2em',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};
