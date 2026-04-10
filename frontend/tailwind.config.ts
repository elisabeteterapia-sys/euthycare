import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#F2F7F4',
          100: '#E0EDE5',
          200: '#C1DBCB',
          300: '#97C2A8',
          400: '#7B9E87',   // primary
          500: '#5C8A6B',
          600: '#4A7257',
          700: '#3A5A44',
          800: '#2D4534',
          900: '#1E2E23',
        },
        lilac: {
          50:  '#F6F3FA',
          100: '#EDE7F5',
          200: '#D9CFEB',
          300: '#C4B5D4',   // accent light
          400: '#B09BC4',
          500: '#9A81B3',
          600: '#7D63A0',
          700: '#634E82',
          800: '#4A3A61',
          900: '#302540',
        },
        cream: {
          50:  '#FEFDFB',
          100: '#FAF6EE',   // card bg
          200: '#F5EFE0',   // page bg
          300: '#EDE3CC',
          400: '#E0D0B0',
          500: '#C8B48A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(91,138,107,0.08)',
        card: '0 4px 24px 0 rgba(91,138,107,0.10)',
        lilac: '0 4px 24px 0 rgba(154,129,179,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
