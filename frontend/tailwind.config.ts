import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1F3A",
          light: "#13315C",
          dark: "#071426",
        },
        trust: {
          DEFAULT: "#1D6F5C",
          light: "#2E9E82",
        },
        amber: {
          DEFAULT: "#B8790A",
          light: "#F4B740",
          bg: "#FEF3D9",
        },
        contradict: {
          DEFAULT: "#B3261E",
          light: "#E24C42",
          bg: "#FBE4E2",
        },
        verified: {
          DEFAULT: "#1D6F5C",
          bg: "#E1F3ED",
        },
        unverified: {
          DEFAULT: "#B8790A",
          bg: "#FEF3D9",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans",
          "Noto Sans Devanagari",
          "Noto Sans Gurmukhi",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
