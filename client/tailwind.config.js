import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f3f0',
          100: '#e8e4de',
          200: '#d1c9bd',
          300: '#b5a898',
          400: '#9a8873',
          500: '#7f6950',
          600: '#6b5743',
          700: '#4a3c2f',
          800: '#2d251e',
          850: '#201a14',
          900: '#16120e',
          950: '#0d0a08',
        },
        gold: {
          300: '#fcd879',
          400: '#f5c542',
          500: '#d4a324',
          600: '#b8891a',
          700: '#8a6613',
        },
        lorcana: {
          amber: '#F5A623',
          amethyst: '#9B59B6',
          emerald: '#27AE60',
          ruby: '#E74C3C',
          sapphire: '#3498DB',
          steel: '#95A5A6',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'ink-gradient': 'linear-gradient(135deg, #16120e 0%, #1a1510 50%, #1e1815 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(45,37,30,0.8) 0%, rgba(32,26,20,0.95) 100%)',
        'gold-shimmer': 'linear-gradient(135deg, #d4a324 0%, #f5c542 50%, #d4a324 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212,163,36,0.15)',
        'glow-gold-sm': '0 0 10px rgba(212,163,36,0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
      },
      borderColor: {
        'ink-border': 'rgba(212,163,36,0.15)',
      },
    },
  },
  plugins: [forms],
};
