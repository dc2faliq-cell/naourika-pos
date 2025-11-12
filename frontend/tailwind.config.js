/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f62fe',
        accent: '#ff7a59',
        background: '#f7f9fc',
        textPrimary: '#0b1320',
      },
    },
  },
  plugins: [],
}