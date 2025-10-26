/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ts-orange': {
          50: '#FFF5F3',
          100: '#FFE8E5',
          200: '#FFD1CC',
          300: '#FFB3AA',
          400: '#FF8A7D',
          500: '#FF6154', // Primary ThoughtSpot Orange
          600: '#E64539',
          700: '#C43327',
          800: '#9F2820',
          900: '#7A1F19',
        },
        'ts-blue': {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43', // Dark blue
        },
        'ts-teal': {
          400: '#4FD1C5',
          500: '#38B2AC',
          600: '#319795',
        },
      },
    },
  },
  plugins: [],
}
