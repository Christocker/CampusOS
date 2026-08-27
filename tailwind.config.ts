import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#FFFCF5",
          dark: "#1A1A1A",
        },
        card: {
          light: "#FFFFFF",
          dark: "#242424",
        },
        primary: {
          DEFAULT: "#FFCC00",
          soft: "#FFF8DC",
          dark: "#FFD60A",
        },
        accent: {
          DEFAULT: "#FF9500",
          soft: "#FFF3E0",
        },
        success: "#34C759",
        warning: "#FF9500",
        danger: "#FF3B30",
        ink: {
          DEFAULT: "#1C1C1E",
          muted: "#8E8E93",
          inverse: "#FFFFFF",
        },
        border: {
          light: "#E8E5DC",
          dark: "#3A3A3A",
        },
        separator: {
          light: "#E0DDD4",
          dark: "#383838",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04)",
        card: "0 1px 4px rgba(0,0,0,0.06)",
        float: "0 8px 32px rgba(0,0,0,0.10)",
      },
      fontSize: {
        "note-title": ["17px", { lineHeight: "22px", fontWeight: "600" }],
        "note-body": ["16px", { lineHeight: "22px" }],
        "note-caption": ["13px", { lineHeight: "18px" }],
        "note-headline": ["15px", { lineHeight: "20px", fontWeight: "600" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
