import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f172a",
        muted: "#64748b",
        paper: "#ffffff",
        soft: "#f8fafc",
        line: "#e2e8f0",
        brand: {
          DEFAULT: "#10b981",
          dark: "#059669",
          tint: "#ecfdf5",
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
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
