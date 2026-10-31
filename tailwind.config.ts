import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        muted: "#6d7885",
        brand: "#246b5d",
        "brand-dark": "#194f45",
        "brand-pale": "#e9f4f0",
        canvas: "#f6f8f7",
        line: "#e5eae7",
        gold: "#d8a84e"
      },
      boxShadow: {
        soft: "0 16px 48px rgba(27, 51, 43, .08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
