/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                surface: {
                    DEFAULT: "#09090b", // Neutral Black (Zinc-950)
                    dim: "#09090b",
                    bright: "#18181b",  // Zinc-900
                    lowest: "#000000",  // Pure Black
                    low: "#09090b",
                    container: "#121214",
                    high: "#18181b",
                    highest: "#27272a", // Zinc-800
                    variant: "#27272a",
                    deep: "#09090b",
                    elevated: "#18181b",
                    zinc: {
                        DEFAULT: "#18181b",
                        deep: "#09090b",
                        elevated: "#27272a",
                    }
                },
                accent: {
                    DEFAULT: "#EF8852",  // Primary orange
                    muted: "#3f3f46",    // Neutral Zinc-700
                    deep: "#262626",     // Very dark gray
                    light: "#f97316",    // Brighter orange for contrast
                    bright: "#fb923c",
                    amber: "#f59e0b",
                    rust: "#ea580c",
                    taupe: "#52525b",
                    sienna: "#3f3f46",
                    chocolate: "#171717"
                },
                // Neutralized semantic keys
                "on-surface-variant": "#a1a1aa", // zinc-400
                "on-background": "#f4f4f5",      // zinc-100
                "on-surface": "#f4f4f5",
                "primary": "#EF8852",            // Use pure orange
                "primary-container": "#7c2d12",  // Deep orange/rust
                "on-primary": "#ffffff",
                "on-primary-container": "#ffedd5",
                "secondary": "#06b6d4",          // Cyan
                "secondary-container": "#164e63",
                "tertiary": "#d946ef",           // Fuchsia
                "tertiary-container": "#701a75",
                "error": "#ef4444",              // Standard Red
                "outline": "#52525b",            // zinc-600
                "outline-variant": "#3f3f46",    // zinc-700
            },
            fontFamily: {
                "headline": ["Space Grotesk"],
                "body": ["Manrope"],
                "label": ["Space Grotesk"]
            },
            borderRadius: {
                "none": "0",
                "sm": "0.125rem",
                "DEFAULT": "4px",
                "md": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px"
            },
            boxShadow: {
                "glow": "0 0 20px rgba(239, 136, 82, 0.4)",
                "glow-orange": "0 0 20px rgba(255, 107, 0, 0.4)",
                "glow-cyan": "0 0 20px rgba(0, 238, 252, 0.4)",
                "glow-red": "0 0 20px rgba(239, 68, 68, 0.4)",
                "glow-emerald": "0 0 20px rgba(52, 211, 153, 0.4)",
                "glow-amber": "0 0 20px rgba(245, 158, 11, 0.4)",
                "premium": "0 20px 50px -12px rgba(0, 0, 0, 0.9)",
            },
            backgroundImage: {
                "forged-gradient": "linear-gradient(135deg, #ff6b00 0%, #ffb693 100%)",
                "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
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
    plugins: [
        function ({ addUtilities }: any) {
            const newUtilities = {
                '.perspective-1000': {
                    perspective: '1000px',
                },
                '.rotate-y-12': {
                    transform: 'rotateY(12deg)',
                },
                '.rotate-y-0': {
                    transform: 'rotateY(0deg)',
                },
                '.text-glow-cyan': {
                    textShadow: '0 0 15px rgba(0, 238, 252, 0.4)',
                },
                '.text-glow-orange': {
                    textShadow: '0 0 15px rgba(255, 107, 0, 0.4)',
                }
            }
            addUtilities(newUtilities)
        }
    ],
};
