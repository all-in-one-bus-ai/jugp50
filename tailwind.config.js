/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jubilee: {
          50: '#F0F9F4',
          100: '#D4EDE0',
          200: '#A8DBBF',
          300: '#6BC295',
          400: '#3BA06F',
          500: '#1A7A4E',
          600: '#0D4B3C',
          700: '#0B3D2C',
          800: '#082E21',
          900: '#051E16',
        },
        gold: {
          50: '#FFF9EB',
          100: '#FFF0CC',
          200: '#FFE099',
          300: '#FFD066',
          400: '#E6B84C',
          500: '#C9A84C',
          600: '#B8973B',
          700: '#9A7D2E',
          800: '#7C6424',
          900: '#5E4B1B',
        },
        cream: {
          50: '#FFFDF8',
          100: '#FFF8F0',
          200: '#FFF3E5',
          300: '#FFEDD5',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
