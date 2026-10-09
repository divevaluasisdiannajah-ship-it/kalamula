import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Font Stack (DM Sans + Fraunces / Recoleta + System) ─────
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        brand: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "DM Sans",
          "sans-serif",
        ],
        outfit: [
          "var(--font-outfit)",
          "Outfit",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        nunito: [
          "var(--font-nunito)",
          "Nunito",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        serif: [
          "var(--font-fraunces)",
          "Recoleta",
          "Georgia",
          "serif",
        ],
      },

      // ─── Kalamula Warm Earth & Twilight Palette (DESIGN.md) ──────
      colors: {
        // Kalamula Warm Oat Canvas
        "ios-bg": "#FAF7F2",             // Warm Oat / Soft Cream (Kertas gambar hangat)
        "ios-bg-secondary": "#F3EFE8",
        "ios-bg-tertiary": "#EBE6DF",   // Pebble Grey

        // Pure Milk Surface
        "ios-surface": "#FFFFFF",
        "ios-surface-elevated": "#FFFFFF",

        // Pebble Grey Separators
        "ios-separator": "#E8E2D8",
        "ios-separator-opaque": "#DDD7CE",

        // Deep Espresso & Earth Umber
        "ios-label": "#2C2725",          // Deep Espresso (hitam arang cokelat hangat)
        "ios-label-secondary": "#5C544F",// WCAG AA warm charcoal secondary
        "ios-label-tertiary": "#7A726D", // Earth Umber Muted
        "ios-label-quaternary": "#9A928D",
        "ios-placeholder": "#A8A09A",

        // Kalamula Brand Primaries
        "color-primary": "#C86D51",      // Terracotta / Warm Clay (Pijakan awal kukuh)
        "color-secondary": "#7E9A86",    // Muted Sage Green (Tunas pertama bertumbuh)
        "color-balance": "#4A5D6E",      // Dusk Slate (Langit senja teduh)

        // Semantic compatibility aliases
        "ios-blue": "#7E9A86",           // Muted Sage
        "ios-blue-light": "#96B09E",
        "ios-blue-dark": "#4E6B56",
        "ios-blue-surface": "#F2F7F4",

        "ios-green": "#4E6B56",          // Sage Forest
        "ios-green-light": "#7E9A86",
        "ios-orange": "#C86D51",         // Terracotta / Warm Clay
        "ios-amber": "#B56C2D",
        "ios-red": "#C86D51",            // Warm Clay (menghilangkan merah alarm kaku)
        "ios-red-light": "#DB7D63",
        "ios-yellow": "#C49A2B",
        "ios-purple": "#5F506B",
        "ios-teal": "#4A5D6E",           // Dusk Slate
        "ios-indigo": "#4A5D6E",         // Dusk Slate

        // Kalamula Palette Named Scales
        clay: {
          50: "#FCF6F4",
          100: "#F7EAE5",
          200: "#EED2C9",
          300: "#E1B3A4",
          400: "#D58F7B",
          500: "#C86D51",                // Terracotta Warm Clay
          600: "#B6583C",
          700: "#99452C",
          800: "#7C3722",
          900: "#5F2A1A",
        },
        sage: {
          50: "#F4F7F5",
          100: "#E4EDE7",
          200: "#C9DBD0",
          300: "#ABC5B3",
          400: "#94B29D",
          500: "#7E9A86",                // Muted Sage Green
          600: "#65826D",
          700: "#4E6B56",
          800: "#3B5242",
          900: "#27372D",
        },
        dusk: {
          50: "#F2F5F8",
          100: "#E2E8EE",
          200: "#C5D2DE",
          300: "#A2B7C8",
          400: "#7593AC",
          500: "#4A5D6E",                // Dusk Slate
          600: "#3D4E5D",
          700: "#313F4B",
          800: "#252F39",
          900: "#1A2127",
        },
        oat: "#FAF7F2",
        espresso: "#2C2725",
        umber: "#7A726D",
        pebble: "#EBE6DF",
      },

      // ─── Border Radius System ─────────────────────────────────────
      borderRadius: {
        "ios-sm": "8px",
        "ios-md": "12px",
        "ios-lg": "16px",
        "ios-xl": "20px",
        "ios-2xl": "24px",
      },

      // ─── Elevation Shadows (Replaces dark outlines with ambient depth) ──
      boxShadow: {
        "ios-sm": "0 2px 8px -1px rgba(30, 35, 32, 0.08), 0 1px 3px rgba(30, 35, 32, 0.04)",
        "ios-card": "0 4px 20px -2px rgba(30, 35, 32, 0.08), 0 2px 6px -1px rgba(30, 35, 32, 0.04)",
        "ios-md": "0 8px 30px -4px rgba(30, 35, 32, 0.10), 0 4px 10px -2px rgba(30, 35, 32, 0.05)",
        "ios-lg": "0 16px 40px -6px rgba(30, 35, 32, 0.12), 0 6px 16px -2px rgba(30, 35, 32, 0.06)",
      },

      // ─── Ergonomic Touch Dimensions ───────────────────────────────
      height: {
        "touch": "48px",
        "touch-lg": "56px",
      },
      minHeight: {
        "touch": "48px",
        "touch-lg": "56px",
      },
      minWidth: {
        "touch": "48px",
        "touch-lg": "56px",
      },

      // ─── Timing ───────────────────────────────────────────────────
      transitionDuration: {
        "ios-fast": "150ms",
        "ios": "250ms",
        "ios-slow": "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
