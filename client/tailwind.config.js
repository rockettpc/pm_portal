/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00b4f0', // CGI Cyan
          600: '#0095d9',
          700: '#0078be', // CGI Deep Blue
          800: '#0369a1',
          900: '#0c4a6e',
          950: '#082f49',
        },
        cgi: {
          cyan: '#00b4f0',
          blue: '#0078be',
          dark: '#0a192f',
          surface: '#0d1f38'
        }
      },
    },
  },
  plugins: [],
}
