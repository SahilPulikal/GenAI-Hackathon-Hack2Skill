/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0A0D14",
        panelBg: "rgba(16, 20, 30, 0.65)",
        cardBorder: "rgba(255, 255, 255, 0.06)",
        accentTeal: "#14B8A6",
        accentBlue: "#3B82F6",
        accentGreen: "#10B981",
        accentRose: "#F43F5E",
        accentAmber: "#F59E0B"
      },
      backdropBlur: {
        xs: "2px"
      }
    },
  },
  plugins: [],
}
