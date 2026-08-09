/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "../templates/index.html"],
  theme: {
    extend: {
      colors: {
        // Sampled from the real logo's gradient "D" mark — not invented.
        brand: {
          50: "#EAF6FD",
          100: "#D0EAFA",
          200: "#A3D6F5",
          300: "#6BBEEE",
          400: "#40C0F0", // logo highlight
          500: "#1F9BDC",
          600: "#1070C0", // logo deep blue
          700: "#0D5A9C",
          800: "#0B4577",
          900: "#083356",
          950: "#051F35",
        },
        // Sampled from the ship photo's containers — a real accent from the
        // company's own imagery rather than a chosen brand colour.
        rust: {
          400: "#C4693F",
          500: "#A85332",
          600: "#8B4226",
          700: "#6E341E",
        },
        ink: {
          DEFAULT: "#12212E",
          muted: "#54677A",
          soft: "#7F8FA0",
        },
      },
      fontFamily: {
        sans: ['"Plex Arabic"', "system-ui", "-apple-system", "Segoe UI", "Tahoma", "sans-serif"],
      },
      keyframes: {
        "ken-burns": {
          "0%, 100%": { transform: "scale(1.06) translate3d(0, 0, 0)" },
          "50%": { transform: "scale(1.16) translate3d(-1.5%, -1.5%, 0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "sheen": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
      animation: {
        "ken-burns": "ken-burns 28s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        sheen: "sheen 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
