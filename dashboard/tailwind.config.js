/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          black: "var(--lux-bg)",
          dark: "var(--lux-dark)",
          gray: "var(--lux-gray)",
          gold: "var(--lux-gold)",
          goldLight: "var(--lux-gold-light)",
          border: "var(--lux-border)",
          text: "var(--lux-text)",
          textDim: "var(--lux-text-dim)",
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
