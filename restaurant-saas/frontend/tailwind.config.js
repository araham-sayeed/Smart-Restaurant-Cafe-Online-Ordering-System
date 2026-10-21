/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Cafe theme tokens (aliased and extended)
        sand: "#F4EBE2",
        cream: "#F6F1E7",
        terra: { DEFAULT: "#C98B74", dark: "#A66A55" },
        clay: "#C99A83",
        olive: "#8A8F6A",
        sage: { DEFAULT: "#9CAF98", dark: "#6F8570" },
        ink: "#3E4A42",
      },
    },
  },
  plugins: [],
};