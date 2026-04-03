import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette").default;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // NotCast brand renkleri
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#b9e6fe",
          300: "#7cd2fd",
          400: "#36bbf9",
          500: "#0ca2ea",
          600: "#0081c8",
          700: "#0167a3",
          800: "#065886",
          900: "#0a4a6f",
          950: "#07304b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-wave": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.5)" },
        },
        "fade-slide-in": {
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateY(0px)",
          },
        },
        "slide-right-in": {
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateX(0px)",
          },
        },
        "testimonial-in": {
          to: {
            opacity: "1",
            filter: "blur(0px)",
            transform: "translateY(0px) scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-wave": "pulse-wave 1s ease-in-out infinite",
        "fade-slide-in": "fade-slide-in 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-right-in": "slide-right-in 0.9s cubic-bezier(0.16,1,0.3,1) forwards",
        "testimonial-in": "testimonial-in 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  plugins: [
    animate,
    addVariablesForColors,
  ],
};

// Adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
// Required by the aurora-background component.
function addVariablesForColors({ addBase, theme }: { addBase: Function; theme: Function }) {
  const allColors = flattenColorPalette(theme("colors")) as Record<string, string>;
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
  addBase({ ":root": newVars });
}

export default config;
