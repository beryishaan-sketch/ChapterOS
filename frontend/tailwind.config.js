/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1C3F',
          light: '#1a2f6b',
          dark: '#080f24',
          50: '#e8ecf4',
          100: '#c5cfdf',
          200: '#9aafc8',
          300: '#6e8fb1',
          400: '#4d74a0',
          500: '#2c5a8f',
          600: '#1e4070',
          700: '#142d55',
          800: '#0c1e3c',
          900: '#060f21',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#e0c070',
          dark: '#a07830',
          50: '#fdf9ee',
          100: '#f8f0d0',
          200: '#f1e0a0',
          300: '#e8cc6d',
          400: '#ddb947',
          500: '#c9a84c',
          600: '#a88a3a',
          700: '#856c2d',
          800: '#624f20',
          900: '#3f3314',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)',
        nav: '0 1px 0 rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
        glow: '0 0 0 3px rgba(201,168,76,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
