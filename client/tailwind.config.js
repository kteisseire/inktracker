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
          haze: '#14102a', // warm pane fill for section-wash + solid fallback behind blur
        },
        gold: {
          300: '#fcd879',
          400: '#f5c542',
          500: '#d4a324',
          600: '#b8891a',
          700: '#8a6613',
          ink: '#2a2008', // warm dark label text ON gold buttons
        },
        // Codex Illuminé tokens
        rule: 'rgba(39,32,64,0.6)',        // solid default divider (ink-700 @ 60%) — never vanishes in bright light
        'rule-gold': 'rgba(245,197,66,0.40)', // active/selected/terminator hairline
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
        display: ['Marcellus', 'Cormorant Garamond', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Folio display scale (Codex Vivant) — fluid, one giant per screen
        'folio-hero': ['clamp(3.5rem, 14vw, 6rem)', { lineHeight: '0.85', letterSpacing: '-0.02em' }],
        'folio-title': ['clamp(2rem, 8vw, 3.25rem)', { lineHeight: '1.0', letterSpacing: '0.03em' }],
        'folio-name': ['clamp(1.5rem, 5vw, 2.25rem)', { lineHeight: '1.05', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        // One system, three steps (manuscripts + instruments have crisp edges)
        sm: '6px',
        md: '6px',   // inputs, chips, badges
        lg: '10px',  // buttons, list rows, dropdown panels
        xl: '14px',  // cards, panels, modals
        '2xl': '14px', // retired → folds into card radius
      },
      backgroundImage: {
        'ink-gradient': 'radial-gradient(ellipse at 50% 0%, #1a1035 0%, #0c0a14 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(26,16,53,0.8) 0%, rgba(12,10,20,0.95) 100%)',
      },
      boxShadow: {
        // Tinted to the void — never gold glow at rest
        'card': '0 2px 16px rgba(8,6,15,0.55)',
        'card-hover': '0 6px 28px rgba(8,6,15,0.7)',
        'edge-lit': 'inset 0 1px 0 rgba(245,197,66,0.18)', // single top-edge catch-light (hero/modal only)
      },
    },
  },
  plugins: [forms],
};
