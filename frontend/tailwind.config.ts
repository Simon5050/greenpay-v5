import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        forest: {
          50:  "#f0faf0",
          100: "#d8f5d8",
          200: "#b0ebb1",
          300: "#78d97a",
          400: "#46c248",
          500: "#25a828",
          600: "#198a1c",
          700: "#156e18",
          800: "#145717",
          900: "#114915",
          950: "#04270a",
        },
        earth: {
          50:  "#fdf8f0",
          100: "#faefd8",
          200: "#f3d9a8",
          300: "#eabd6e",
          400: "#e09e3e",
          500: "#d4831f",
          600: "#bb6617",
          700: "#994e17",
          800: "#7d3f19",
          900: "#673518",
          950: "#38190a",
        },
        slate: {
          850: "#172033",
          950: "#090e1a",
        },
      },
      backgroundImage: {
        "mesh-green":
          "radial-gradient(at 20% 20%, hsla(145,60%,20%,0.5) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(100,50%,15%,0.4) 0px, transparent 50%)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
