/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Stitch Design Palette
                "on-surface-variant": "#e2bfb0",
                "surface-container-highest": "#343537",
                "on-tertiary-container": "#530073",
                "on-background": "#e3e2e5",
                "secondary-fixed": "#7df4ff",
                "on-tertiary": "#520071",
                "surface-dim": "#121315",
                "on-surface": "#e3e2e5",
                "surface-container-high": "#292a2c",
                "on-primary-fixed": "#351000",
                "on-primary-fixed-variant": "#7a3000",
                "tertiary": "#ebb2ff",
                "primary": "#ffb693",
                "outline-variant": "#5a4136",
                "on-tertiary-fixed-variant": "#74009f",
                "on-secondary-fixed": "#002022",
                "inverse-primary": "#a04100",
                "surface-container-low": "#1b1c1e",
                "on-tertiary-fixed": "#320047",
                "primary-container": "#ff6b00",
                "secondary": "#00eeec",
                "on-primary-container": "#572000",
                "surface-container-lowest": "#0d0e10",
                "surface-tint": "#ffb693",
                "inverse-on-surface": "#303033",
                "surface-container": "#1f2022",
                "background": "#121315",
                "secondary-container": "#00eefc",
                "on-error": "#690005",
                "secondary-fixed-dim": "#00dbe9",
                "surface-bright": "#38393b",
                "on-error-container": "#ffdad6",
                "on-secondary-fixed-variant": "#004f54",
                "outline": "#a98a7d",
                "error-container": "#93000a",
                "tertiary-container": "#d36cff",
                "primary-fixed": "#ffdbcc",
                "tertiary-fixed": "#f8d8ff",
                "tertiary-fixed-dim": "#ebb2ff",
                "on-secondary-container": "#00686f",
                "inverse-surface": "#e3e2e5",
                "on-primary": "#561f00",
                "error": "#ffb4ab",
                "surface-variant": "#343537",
                "primary-fixed-dim": "#ffb693",
                "on-secondary": "#00363a",

                // Zinc-based Surface Palette (Remote branch contribution)
                surface: {
                    DEFAULT: "#18181b",
                    deep: "#09090b",
                    elevated: "#27272a",
                    50: "#27272a",
                    100: "#27272a",
                    200: "#18181b",
                    300: "#121214"
                },

                // Backward Compatibility Palette (Restored)
                "surface-deep": "#1a1110",
                "surface-elevated": "#4d332f",
                "accent-muted": "#AB7E75",
                "text-primary": "#f5f0ee",
                "text-secondary": "#ab7e75",

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
