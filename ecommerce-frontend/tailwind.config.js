/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    return opacityValue !== undefined
      ? `rgb(var(${variableName}) / ${opacityValue})`
      : `rgb(var(${variableName}))`;
  };
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: withOpacity('--brand-50'),
          100: withOpacity('--brand-100'),
          200: withOpacity('--brand-200'),
          accent: withOpacity('--brand-accent'),
          600: withOpacity('--brand-600'),
          700: withOpacity('--brand-700'),
          800: withOpacity('--brand-800'),
          900: withOpacity('--brand-900'),
        },
        surface: {
          page: withOpacity('--surface-page'),
          card: withOpacity('--surface-card'),
          subtle: withOpacity('--surface-subtle'),
          hover: withOpacity('--surface-hover'),
        },
        line: {
          100: withOpacity('--line-100'),
          200: withOpacity('--line-200'),
          300: withOpacity('--line-300'),
          400: withOpacity('--line-400'),
        },
        ink: {
          300: withOpacity('--ink-300'),
          500: withOpacity('--ink-500'),
          700: withOpacity('--ink-700'),
          900: withOpacity('--ink-900'),
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
          300: '#FDBA74',
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
        'gradient-hero': 'var(--gradient-hero)',
        'hero-glow': 'var(--hero-glow)',
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
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fade-in 150ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
