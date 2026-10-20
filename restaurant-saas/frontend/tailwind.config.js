/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Dusty Sage Cafe theme (swap later)
        cream: "#F6F1E7",
        sage: { DEFAULT: "#9CAF98", dark: "#6F8570" },
        clay: "#C99A83",
        ink: "#3E4A42",
      },
    },
  },
  plugins: [],
};