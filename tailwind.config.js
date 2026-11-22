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
        // Warm, soothing canvas tones (Cashmere, Bone, Alabaster, Warm Sand)
        ink: {
          950: '#FAF6F0', // Soft bone/cashmere canvas
          900: '#FFFDF9', // Warm alabaster card surface
          850: '#F5EFEB', // Warm linen
          800: '#EFE7DE', // Warm oat
          700: '#E4D9CA', // Warm sand
          600: '#D5C7B5', // Warm stone border
        },
        // Rich warm espresso/umber typography (gentle on eyes, high contrast without harsh black)
        ivory: {
          50: '#1F1A16',  // Deep warm espresso ink
          100: '#2E2721', // Rich dark roast
          200: '#433A32', // Deep umber
          300: '#5C5046', // Warm deep taupe
          400: '#7E6F62', // Muted warm slate
          500: '#A39486', // Warm stone
        },
        // Warm antique bronze / honey amber accents (organic, prestigious, comforting)
        gold: {
          300: '#C48D52', // Soft warm amber
          400: '#A46E38', // Warm antique bronze
          500: '#8C5928', // Deep burnished bronze
          600: '#73461D', // Deep umber bronze
        },
        // Soft warm clinical tones (subtle warm honey/cream tints, NO harsh greens)
        clinic: {
          50: '#F8F2EA',
          100: '#EFE4D4',
          200: '#DFCEB7',
          300: '#C7AF91',
          400: '#A68865',
          500: '#8C5928',
          600: '#73461D',
          700: '#5A3514',
          800: '#42250C',
          900: '#2B1705',
        },
      },
      boxShadow: {
        lift: '0 18px 50px -28px rgba(31, 26, 22, 0.3)',
        soft: '0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px -14px rgba(31, 26, 22, 0.12)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
};
