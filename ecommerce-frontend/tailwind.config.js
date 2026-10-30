/**
 * Tailwind CSS config — token thiết kế từ AI 2 (UI/UX Designer).
 * Chỉ dùng cú pháp Tailwind v3 (theme.extend), KHÔNG dùng cú pháp v4.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          accent: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        surface: {
          page: '#F5F6FA',
          card: '#FFFFFF',
          subtle: '#F8F9FC',
          hover: '#F1F5F9',
        },
        line: {
          100: '#F0F1F5',
          200: '#E7E9F1',
          300: '#C9CDDD',
          400: '#C7CBDD',
        },
        ink: {
          300: '#9A9CAD',
          500: '#6B6E82',
          700: '#41445A',
          900: '#191B2A',
        },
        status: {
          success: { DEFAULT: '#10B981', text: '#047857', bg: '#D1FAE5', strong: '#059669' },
          warning: { DEFAULT: '#F59E0B', text: '#B45309', bg: '#FEF3C7' },
          danger: { DEFAULT: '#EF4444', text: '#DC2626', bg: '#FEE2E2', strong: '#B91C1C' },
          info: { DEFAULT: '#3B82F6', text: '#2563EB', bg: '#DBEAFE', strong: '#1D4ED8' },
        },
        flash: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        price: {
          50: '#FEF2F2',
          600: '#DC2626',
          700: '#B91C1C',
        },
        star: {
          DEFAULT: '#FACC15',
          empty: '#E7E9F1',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(115deg, #EEF2FF 0%, #F5F6FA 42%, #FFFFFF 100%)',
        'hero-glow': 'radial-gradient(80% 120% at 82% 12%, rgba(79,70,229,0.16) 0%, rgba(79,70,229,0) 62%)',
        'gradient-cta': 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
      },
      maxWidth: {
        'container-prose': '38rem',
        'container-page': '1280px',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],
        xs: ['12px', { lineHeight: '1.3333', fontWeight: '400' }],
        sm: ['14px', { lineHeight: '1.4286', fontWeight: '400' }],
        base: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        lg: ['18px', { lineHeight: '1.5556', fontWeight: '400' }],
        xl: ['20px', { lineHeight: '1.4', fontWeight: '400' }],
        '2xl': ['24px', { lineHeight: '1.3333', fontWeight: '700' }],
        '3xl': ['30px', { lineHeight: '1.2', fontWeight: '700' }],
        '4xl': ['36px', { lineHeight: '1.1111', fontWeight: '700' }],
        '5xl': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        '6xl': ['60px', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      spacing: {
        'page-gutter': '1rem',
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(25, 27, 42, 0.04), 0 8px 24px rgba(25, 27, 42, 0.06)',
        'card-hover': '0 8px 32px rgba(25, 27, 42, 0.12)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 22s linear infinite',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
