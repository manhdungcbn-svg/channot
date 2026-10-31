/**
 * Tailwind CSS config — Design System cho BảoHành Pro.
 *
 * Triết lý: mọi màu trong app đều truy vết về đây (không hardcode hex trong JSX).
 * Palette chủ đạo: TEAL (#0D9488) — tách biệt khỏi storefront (indigo #4F46E5).
 *
 * Dark mode: dùng chiến lược `class` (gắn class `dark` lên <html>).
 * Vì vậy màu semantic được khai báo qua CSS biến trong index.css, không dùng
 * `darkMode: 'media'` — cho phép người dùng chủ động bật/tắt.
 *
 * @type {import('tailwindcss').Config}
 */

/** Indigo scale — màu chủ đạo đồng bộ với Storefront */
const indigo = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#1E1B4B',
  950: '#0F0E2A',
}

/** Brand semantic — đồng bộ với Storefront */
const brand = {
  50: indigo[50],
  100: indigo[100],
  200: indigo[200],
  300: indigo[300],
  400: indigo[400],
  500: indigo[500],
  600: indigo[600],
  700: indigo[700],
  800: indigo[800],
  900: indigo[900],
  950: indigo[950],
  accent: '#4F46E5',
  'accent-hover': '#4338CA',
  DEFAULT: indigo[600],
  fg: '#FFFFFF',
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand,
        // Trung tính — dùng cho text/border
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        line: {
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
        },
        surface: {
          page: '#F6F8FA',
          card: '#FFFFFF',
          subtle: '#F8FAFC',
          hover: '#F1F5F9',
          sunken: '#F1F5F9',
          inverse: '#0F172A',
        },
        status: {
          success: { DEFAULT: '#10B981', text: '#047857', bg: '#D1FAE5', strong: '#059669' },
          warning: { DEFAULT: '#F59E0B', text: '#B45309', bg: '#FEF3C7', strong: '#D97706' },
          danger: { DEFAULT: '#EF4444', text: '#B91C1C', bg: '#FEE2E2', strong: '#DC2626' },
          info: { DEFAULT: '#3B82F6', text: '#1D4ED8', bg: '#DBEAFE', strong: '#2563EB' },
        },
        accent: {
          violet: '#7C3AED',
          blue: '#2563EB',
          green: '#059669',
          orange: '#EA580C',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #3730A3 0%, #4338CA 100%)',
        'brand-dark': 'linear-gradient(145deg, #1E1B4B 0%, #4338CA 58%, #4F46E5 100%)',
        'brand-dark-hover': 'linear-gradient(145deg, #312E81 0%, #3730A3 58%, #4338CA 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.12)',
        brand: '0 7px 18px rgba(79, 70, 229, 0.22)',
        'brand-lg': '0 12px 32px rgba(79, 70, 229, 0.28)',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      maxWidth: {
        page: '1680px',
        'container-prose': '42rem',
      },
      spacing: {
        'page-gutter': '1rem',
        'sidebar-w': '264px',
        'sidebar-w-collapsed': '72px',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
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
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        'scale-in': 'scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
