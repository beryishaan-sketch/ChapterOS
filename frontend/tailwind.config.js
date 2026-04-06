/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // New design system
        surface: '#0D1424',
        elevated: '#131D2E',
        sidebar: '#0A0F1C',
        accent: { DEFAULT: '#4F8EF7', hover: '#6a9ef8' },
        // Legacy (keep for compatibility)
        navy: {
          DEFAULT: '#0F1C3F', light: '#1a2f6b', dark: '#080f24',
          50: '#e8ecf4', 100: '#c5cfdf', 200: '#9aafc8', 300: '#6e8fb1',
          400: '#4d74a0', 500: '#2c5a8f', 600: '#1e4070', 700: '#142d55',
          800: '#0c1e3c', 900: '#060f21',
        },
        gold: {
          DEFAULT: '#F0B429', light: '#f5c842', dark: '#d49b1a',
          50: '#fdf9ee', 100: '#f8f0d0', 200: '#f1e0a0', 300: '#e8cc6d',
          400: '#ddb947', 500: '#F0B429', 600: '#a88a3a', 700: '#856c2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.5)',
        glow:        '0 0 20px rgba(79,142,247,0.3)',
        'glow-gold': '0 0 20px rgba(240,180,41,0.25)',
        modal:       '0 24px 80px rgba(0,0,0,0.6)',
        nav:         '0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out both',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in': 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':  'shimmer 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-100%)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '100% 0' }, '100%': { backgroundPosition: '-100% 0' } },
      },
    },
  },
  plugins: [],
};
