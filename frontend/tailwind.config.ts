/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
            colors: {
                surface: {
                    DEFAULT: "#18181b",
                    deep: "#09090b",
                    elevated: "#27272a",
                    50: "#27272a",
                    100: "#27272a",
                    200: "#18181b",
                    300: "#121214"
                },
                accent: {
                    DEFAULT: "#EF8852",
                    light: "#fdbba7",   // Light Peach
                    bright: "#ff6b35",  // Bright Vibrant Orange
                    amber: "#f59e0b",   // Amber/Yellow-Orange
                    rust: "#d9480f",    // Deep Rust Orange
                    muted: "#ab7e75",
                    deep: "#82463c"
                },
                warm: {
                    peach: "#ef8852",
                    taupe: "#ab7e75",
                    sienna: "#82463c",
                    chocolate: "#382522"
                }
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
