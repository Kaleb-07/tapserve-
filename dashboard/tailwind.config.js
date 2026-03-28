/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          black: "#0a0a0a",
          dark: "#121212",
          gray: "#1a1a1a",
          gold: "#d4af37",
          goldLight: "#f1d592",
          goldDark: "#aa8d2e",
          border: "#2a2a2a",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)',
      }
    },
  },
  plugins: [],
}
