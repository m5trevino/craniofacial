/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { 'neon-green': '#00ff41', 'tactical-gray': '#0d0d0d' }
    },
  },
  plugins: [],
}
