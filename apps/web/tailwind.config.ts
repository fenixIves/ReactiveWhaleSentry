import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f5f7f2",
        tide: "#c6f1e7",
        ember: "#f97316",
        forest: "#0f3d3e",
        gold: "#eab308",
        ocean: "#0b6d77",
        slate: "#1f2937"
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia"]
      },
      boxShadow: {
        panel: "0 20px 50px rgba(15, 61, 62, 0.12)",
        glow: "0 0 0 1px rgba(15, 61, 62, 0.08), 0 25px 60px rgba(15, 61, 62, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
