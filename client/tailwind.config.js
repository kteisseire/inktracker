import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Échelle pilotée par le mode (dark / parchemin). En mode clair, la rampe
        // est inversée dans index.css : 950 reste « fond de page », 50/100 « texte »,
        // donc tout l'app bascule sans toucher aux className.
        ink: {
          50:  'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          haze: 'rgb(var(--ink-haze) / <alpha-value>)', // warm pane fill for section-wash + solid fallback behind blur
        },
        // "gold" est désormais l'accent du thème actif (variables CSS posées par
        // ThemeContext, défauts = palette dorée d'origine dans index.css :root)
        gold: {
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)', // warm dark label text ON gold buttons
        },
        // Statut sémantique, mode-aware (clair sur sombre / sombre sur parchemin)
        win: 'rgb(var(--win) / <alpha-value>)',
        loss: 'rgb(var(--loss) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        // Codex Illuminé tokens
        rule: 'var(--rule)',        // solid default divider — mode-aware (dark: indigo @60%, light: warm ink)
        'rule-gold': 'var(--rule-gold)', // active/selected/terminator hairline (thémé)
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
        'edge-lit': 'inset 0 1px 0 rgb(var(--accent-400) / 0.18)', // single top-edge catch-light (hero/modal only)
      },
    },
  },
  plugins: [forms],
};
