import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#0E0E0E",
        "surface-elevated": "#141414",
        border: "#15803D",
        "border-muted": "#1E293B",
        primary: {
          DEFAULT: "#15803D",
          hover: "#166534",
          muted: "rgba(21, 128, 61, 0.15)",
          border: "#15803D",
        },
        purple: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          muted: "rgba(124, 58, 237, 0.15)",
        },
        yellow: {
          DEFAULT: "#FACC15",
          hover: "#EAB308",
          muted: "rgba(250, 204, 21, 0.15)",
        },
        orange: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          muted: "rgba(249, 115, 22, 0.15)",
        },
        text: {
          DEFAULT: "#E5E5E5",
          muted: "#9E9E9E",
          dim: "#666666",
        },
        status: {
          success: "#15803D",
          warning: "#FACC15",
          danger: "#F97316",
          crypto: "#7C3AED",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #15803D",
        "brutal-yellow": "4px 4px 0px 0px #FACC15",
        "brutal-purple": "4px 4px 0px 0px #7C3AED",
        "brutal-orange": "4px 4px 0px 0px #F97316",
        "brutal-dark": "4px 4px 0px 0px #1E293B",
        "brutal-lg": "6px 6px 0px 0px #15803D",
        "brutal-lg-yellow": "6px 6px 0px 0px #FACC15",
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      animation: {
        "shimmer": "shimmer 2s linear infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
