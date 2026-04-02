import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50:  '#eeedf5',
          100: '#d8d5ea',
          200: '#b4aed4',
          300: '#8e86b8',
          400: '#6b619a',
          500: '#4e4678',
          600: '#38305a',
          700: '#272040',
          800: '#1a1530',
          850: '#130f26',
          900: '#0e0b1e',
          950: '#08060f',
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
        'ink-gradient': 'radial-gradient(ellipse at 50% 0%, #1a1035 0%, #0c0a14 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(26,16,53,0.8) 0%, rgba(12,10,20,0.95) 100%)',
        'gold-shimmer': 'linear-gradient(135deg, #d4a324 0%, #f5c542 50%, #d4a324 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 24px rgba(212,163,36,0.2)',
        'glow-gold-sm': '0 0 12px rgba(212,163,36,0.12)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.65)',
      },
      borderColor: {
        'ink-border': 'rgba(212,163,36,0.15)',
      },
    },
  },
  plugins: [forms],
};
