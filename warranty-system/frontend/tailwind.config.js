/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Disable Tailwind for this project since we're using AdminLTE/Bootstrap
  corePlugins: {
    preflight: false,
  },
}
