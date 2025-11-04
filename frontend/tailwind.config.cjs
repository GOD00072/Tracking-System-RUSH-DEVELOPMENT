/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF4ED',
          100: '#FDE9DB',
          200: '#FBD3B7',
          300: '#F9BD93',
          400: '#F8A76F',
          500: '#F6873B',
          600: '#E56B1A',
          700: '#B85415',
          800: '#8B3F10',
          900: '#5E2A0B',
        },
        secondary: {
          50: '#FEFDFB',
          100: '#FDFBF8',
          200: '#FAF5EE',
          300: '#F7F0E4',
          400: '#F4EBDA',
          500: '#F1E6D0',
          600: '#C1B8A6',
          700: '#918A7D',
          800: '#615C53',
          900: '#302E2A',
        },
        accent: {
          50: '#FEF4ED',
          100: '#FDE9DB',
          200: '#FBD3B7',
          300: '#F9BD93',
          400: '#F8A76F',
          500: '#F6873B',
          600: '#E56B1A',
          700: '#B85415',
          800: '#8B3F10',
          900: '#5E2A0B',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
