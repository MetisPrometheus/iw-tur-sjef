import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        cream: "#faf6ef",
        sand: "#f3ecdf",
        ink: "#2a2520",
        muted: "#7a6f60",
        line: "#e6ddc9",
        rust: {
          DEFAULT: "#c4633c",
          dark: "#a14d2c",
          tint: "#fbe7da",
        },
        sage: {
          DEFAULT: "#7c9885",
          dark: "#5d7a66",
          tint: "#e4ede6",
        },
        amber: {
          glow: "#fcd34d",
        },
        pin: {
          breakfast: "#f59e0b",
          coffee: "#fb923c",
          lunch: "#f43f5e",
          activity: "#6366f1",
          dinner: "#ef4444",
          drink: "#8b5cf6",
          lodging: "#10b981",
          custom: "#94a3b8",
        },
      },
      boxShadow: {
        soft: "0 4px 24px rgba(42,37,32,0.07)",
        lift: "0 16px 48px -12px rgba(42,37,32,0.18)",
        sheet: "0 -10px 40px -10px rgba(42,37,32,0.22)",
        pin: "0 0 0 2px white, 0 0 20px 4px rgba(252,211,77,0.55), 0 6px 16px -4px rgba(42,37,32,0.45)",
        glass: "inset 0 0 0 1px rgba(255,255,255,0.7), 0 8px 32px -8px rgba(42,37,32,0.25)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(252,211,77,0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(252,211,77,0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
