/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
 
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        
        brand: {
          DEFAULT: 'var(--primary-color)', 
          50: 'var(--primary-color)',
          100: 'var(--primary-color)',
          200: 'var(--primary-color)',
          300: 'var(--primary-color)',
          400: 'var(--primary-color)',
          500: 'var(--primary-color)',
          600: 'var(--primary-color)', 
          700: 'var(--primary-color)',
          800: 'var(--primary-color)',
          900: 'var(--primary-color)',
        }
      },
    },
  },
  plugins: [],
};