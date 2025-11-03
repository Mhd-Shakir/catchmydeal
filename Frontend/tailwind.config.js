/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent inspired by Pocket Money logo theme (neon money green)
        primary: {
          50: '#eafff4',
          100: '#c6ffe3',
          200: '#8bffc7',
          300: '#4effa8',
          400: '#1efb8e',
          500: '#08f07c',
          600: '#00E676', // recommended accent
          700: '#00c766',
          800: '#00a555',
          900: '#00773c',
        },
        bg: '#000000',
        surface: '#111319',
        text: '#ffffff',
        textMuted: '#9AA0A6',
      },
    },
  },
  plugins: [],
}