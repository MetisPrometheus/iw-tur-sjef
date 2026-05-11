import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0c0a09",
        cream: "#fdfaf4",
        sand: "#f3ede1",
        dust: "#d8cfbd",
        moss: "#5b6f4a",
        rust: "#b85c38",
        sky: "#3a6ea5",
        pin: {
          food: "#e07a5f",
          activity: "#3d5a80",
          lodging: "#81b29a",
          coffee: "#a98467",
          drink: "#9b5de5",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
