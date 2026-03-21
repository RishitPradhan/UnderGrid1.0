/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
            colors: {
                surface: { DEFAULT: "#0a0a0a", 50: "#111111", 100: "#1a1a1a", 200: "#222222", 300: "#2a2a2a" },
                accent: { DEFAULT: "#00d4ff", dark: "#00a8cc", light: "#33ddff" },
                neon: { green: "#00ff88", red: "#ff3333", amber: "#ffaa00" },
            },
            animation: {
                "glow-pulse": "glow-pulse 2s ease-in-out infinite",
                "fade-in": "fade-in 0.5s ease-out",
                "slide-up": "slide-up 0.5s ease-out",
            },
            keyframes: {
                "glow-pulse": {
                    "0%, 100%": { boxShadow: "0 0 5px rgba(0,212,255,0.3)" },
                    "50%": { boxShadow: "0 0 20px rgba(0,212,255,0.6)" },
                },
                "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
                "slide-up": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
            },
        },
    },
    plugins: [],
};
