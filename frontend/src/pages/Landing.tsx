import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    ShieldCheck,
    Activity,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Zap,
    LayoutDashboard,
    Bot,
    Terminal,
    MapPin,
    AlertTriangle
} from "lucide-react";

export default function Landing() {
    return (
        <div className="selection:bg-primary-container selection:text-on-primary-container font-body bg-surface text-on-surface overflow-x-hidden">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-surface-variant/60 backdrop-blur-xl shadow-[0_0_40px_rgba(255,107,0,0.08)]">
                <div className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-[#E3E2E5] uppercase font-headline">MineSafe-v2</div>
                    <div className="hidden md:flex items-center gap-8 font-headline tracking-tight">
                        <a className="text-[#FFB693] font-bold border-b-2 border-[#FF6B00] pb-1" href="#">Platform</a>
                        <a className="text-[#E3E2E5]/70 hover:text-[#E3E2E5] transition-colors" href="#">Solutions</a>
                        <a className="text-[#E3E2E5]/70 hover:text-[#E3E2E5] transition-colors" href="#">Network</a>
                        <a className="text-[#E3E2E5]/70 hover:text-[#E3E2E5] transition-colors" href="#">Company</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="hidden lg:block text-[#E3E2E5]/70 hover:text-[#E3E2E5] transition-colors font-label font-medium uppercase text-xs tracking-widest">Login</button>
                        <button className="forged-gradient text-on-primary px-6 py-2.5 rounded-lg font-headline font-bold text-sm tracking-tight hover:scale-[1.02] active:scale-95 transition-all duration-300">Request Demo</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-8 max-w-[1440px] mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="z-10 space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">System Status: Active</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-headline font-bold tracking-tighter leading-[0.9] text-on-surface">
                            AI-Powered <br />
                            <span className="text-primary">Mine Safety</span> & Monitoring
                        </h1>
                        <p className="text-xl md:text-2xl text-on-surface-variant font-body max-w-xl leading-relaxed">
                            Protect workers. Predict risks. Prevent disasters. The world's first industrial-grade kinetic safety intelligence platform.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/dashboard" className="forged-gradient text-on-primary px-8 py-4 rounded-lg font-headline font-extrabold text-lg flex items-center gap-3 hover:shadow-[0_0_25px_rgba(255,107,0,0.3)] transition-all group">
                                View Dashboard
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="bg-surface-container-high border border-outline-variant/30 text-secondary px-8 py-4 rounded-lg font-headline font-bold text-lg hover:bg-surface-bright transition-all">
                                Request Demo
                            </button>
                        </div>
                    </motion.div>

                    {/* Visual Asset Area */}
                    <div className="relative h-[500px] lg:h-[700px] w-full rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 via-transparent to-secondary-container/5"></div>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#5a4136 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="z-10 text-center flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 border-2 border-dashed border-outline-variant rounded-full flex items-center justify-center"
                            >
                                <LayoutDashboard className="text-outline w-12 h-12" />
                            </motion.div>
                            <p className="font-headline text-on-surface-variant/50 uppercase tracking-[0.3em] text-sm">3D Intelligence Mesh</p>
                        </div>

                        {/* Floating Data Chips */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-10 right-10 glass-panel p-4 rounded-lg space-y-1"
                        >
                            <div className="text-[10px] text-secondary font-bold uppercase">Gas Levels</div>
                            <div className="text-2xl font-headline font-bold">0.02% <span className="text-xs text-on-surface-variant font-normal tracking-normal">CH4</span></div>
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-20 left-10 glass-panel p-4 rounded-lg space-y-1"
                        >
                            <div className="text-[10px] text-primary font-bold uppercase">Seismic Alert</div>
                            <div className="text-2xl font-headline font-bold">0.4 <span className="text-xs text-on-surface-variant font-normal tracking-normal">MAG</span></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="py-24 px-8 max-w-[1440px] mx-auto">
                <div className="mb-16">
                    <h2 className="text-sm font-label uppercase tracking-[0.4em] text-primary mb-4">Capabilities</h2>
                    <h3 className="text-5xl font-headline font-bold">The Kinetic Advantage</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: <MapPin />, color: "primary", title: "Real-Time Monitoring", desc: "Continuous environmental scanning for temperature, humidity, and gas concentrations.", progress: "w-2/3", bg: "primary-container/20" },
                        { icon: <Bot />, color: "secondary", title: "AI-Powered Safety", desc: "Neural networks predict potential hazards before they manifest.", progress: "w-1/2", bg: "secondary-container/20" },
                        { icon: <ShieldCheck />, color: "tertiary", title: "Worker Tracking", desc: "Precise RFID and beacon-based localization ensures every worker is accounted for.", progress: "w-3/4", bg: "tertiary-container/20" },
                        { icon: <AlertTriangle />, color: "error", title: "Emergency Response", desc: "Automated protocols coordinate rescue teams within milliseconds.", progress: "w-1/3", bg: "error-container/20" },
                        { icon: <Zap />, color: "primary", title: "Instant Alerts", desc: "Multi-channel integration for push notifications and emergency voice calls.", progress: "w-4/5", bg: "primary-container/20" },
                        { icon: <Activity />, color: "secondary", title: "Satellite Sync", desc: "Global reach via LEO satellite constellations ensuring connectivity anywhere.", progress: "w-2/5", bg: "secondary-container/20" }
                    ].map((feature, idx) => (
                        <div key={idx} className="glass-panel p-8 rounded-xl group hover:scale-[1.02] hover:bg-surface-bright transition-all duration-500 cursor-default relative overflow-hidden">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 border border-current opacity-80" style={{ color: `var(--${feature.color})`, backgroundColor: `rgba(var(--${feature.color}-rgb), 0.1)` }}>
                                <span className={`text-${feature.color}`}>{feature.icon}</span>
                            </div>
                            <h4 className="text-2xl font-headline font-bold mb-4">{feature.title}</h4>
                            <p className="text-on-surface-variant leading-relaxed mb-6">{feature.desc}</p>
                            <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                                <div className={`h-full bg-${feature.color} ${feature.progress} group-hover:w-full transition-all duration-700`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="py-24 px-8 bg-surface-container-low overflow-hidden">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="relative transform perspective-1000 rotate-y-12 group-hover:rotate-y-0 transition-transform duration-1000">
                                <div className="glass-panel rounded-2xl p-6 border-outline-variant/30 shadow-2xl relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex gap-4">
                                            <div className="w-3 h-3 rounded-full bg-error"></div>
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                            <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                        </div>
                                        <div className="text-xs font-label text-on-surface-variant/50 uppercase tracking-widest">Global Sector 07-B</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-surface-container-high p-4 rounded-lg border border-outline-variant/10">
                                            <div className="text-[10px] uppercase text-on-surface-variant mb-1">Active Miners</div>
                                            <div className="text-3xl font-headline font-bold text-secondary">1,284</div>
                                        </div>
                                        <div className="bg-surface-container-high p-4 rounded-lg border border-outline-variant/10">
                                            <div className="text-[10px] uppercase text-on-surface-variant mb-1">Hazard Zones</div>
                                            <div className="text-3xl font-headline font-bold text-error">03</div>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-lowest h-48 w-full rounded-lg border border-outline-variant/20 p-4 relative overflow-hidden">
                                        <div className="text-[10px] uppercase text-on-surface-variant mb-4">Risk Prediction Index</div>
                                        <svg className="w-full h-32" viewBox="0 0 100 50">
                                            <path d="M0 45 Q 20 40 30 20 T 60 25 T 100 10" fill="none" stroke="#ff6b00" strokeWidth="2"></path>
                                            <path d="M0 45 Q 20 40 30 20 T 60 25 T 100 10 V 50 H 0 Z" fill="url(#grad)" opacity="0.1"></path>
                                            <defs>
                                                <linearGradient id="grad" x1="0%" x2="0%" y1="0%" y2="100%">
                                                    <stop offset="0%" style={{ stopColor: '#ff6b00', stopOpacity: 1 }}></stop>
                                                    <stop offset="100%" style={{ stopColor: '#ff6b00', stopOpacity: 0 }}></stop>
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                                            <span className="text-[8px] uppercase font-bold text-secondary">Analyzing...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-8 text-left">
                            <h2 className="text-4xl md:text-5xl font-headline font-bold leading-tight">Unified Control for <span className="text-secondary text-glow-cyan">Complex Environments.</span></h2>
                            <p className="text-on-surface-variant text-lg leading-relaxed">
                                Our dashboard doesn't just display data; it tells a story of safety. With built-in AI heatmapping and worker trajectory analysis, management teams stay three steps ahead.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="text-primary mt-1 w-5 h-5" />
                                    <div>
                                        <span className="font-bold text-on-surface block">Predictive Hazard Detection</span>
                                        <span className="text-on-surface-variant text-sm text-left block">Algorithms calculate cave-in probabilities and toxic gas build-up.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <CheckCircle className="text-primary mt-1 w-5 h-5" />
                                    <div>
                                        <span className="font-bold text-on-surface block text-left">Worker Vitals Tracking</span>
                                        <span className="text-on-surface-variant text-sm text-left block">Biometric integration for real-time health monitoring.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cycle of Prevention */}
            <section className="py-24 px-8 max-w-[1440px] mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-headline font-bold">The Cycle of Prevention</h2>
                </div>
                <div className="relative grid md:grid-cols-4 gap-8">
                    <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent z-0"></div>
                    {[
                        { icon: <Zap />, title: "Data Collection", desc: "Sensors harvest terabytes of environmental data.", border: "primary" },
                        { icon: <Bot />, title: "AI Analysis", desc: "UnderGrid AI processes patterns to identify risk vectors.", border: "secondary" },
                        { icon: <AlertTriangle />, title: "Risk Detection", desc: "Potential hazards are flagged before they become critical.", border: "tertiary" },
                        { icon: <ShieldAlert />, title: "Alert Trigger", desc: "Instant multi-channel notifications and protocols.", border: "error" }
                    ].map((step, idx) => (
                        <div key={idx} className="relative z-10 text-center space-y-4 group">
                            <div className={`w-24 h-24 mx-auto ${idx === 0 ? 'forged-gradient' : 'glass-panel'} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-transparent`}>
                                <span className={`text-4xl ${idx === 0 ? 'text-on-primary' : `text-${step.border}`}`}>{step.icon}</span>
                            </div>
                            <h4 className="text-xl font-headline font-bold pt-4">{step.title}</h4>
                            <p className="text-sm text-on-surface-variant">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* High Impact CTA */}
            <section className="py-24 px-8 relative overflow-hidden">
                <div className="max-w-[1200px] mx-auto forged-gradient rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,107,0,0.2)]">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl md:text-6xl font-headline font-extrabold text-on-primary tracking-tighter">
                            Start Protecting Your Workforce Today
                        </h2>
                        <p className="text-on-primary-container text-xl max-w-2xl mx-auto font-medium">
                            Deploy the future of mine safety in less than 48 hours. Scalable from small shafts to massive subterranean complexes.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 pt-8">
                            <Link to="/dashboard" className="bg-on-primary text-primary px-10 py-5 rounded-lg font-headline font-extrabold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                Get Started
                            </Link>
                            <button className="bg-transparent border-2 border-on-primary/30 text-on-primary px-10 py-5 rounded-lg font-headline font-extrabold text-xl hover:bg-white/10 transition-all">
                                Book Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface w-full border-t border-outline-variant/15">
                <div className="flex flex-col md:flex-row justify-between items-center w-full px-12 py-16 gap-8 max-w-[1440px] mx-auto">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="font-headline text-lg font-bold text-[#E3E2E5] uppercase">MineSafe-v2</div>
                        <p className="text-[#E3E2E5]/50 text-sm max-w-xs text-left">UnderGrid AI. Building the cognitive backbone for industrial survival.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 font-label text-sm tracking-wide">
                        <a className="text-[#E3E2E5]/50 hover:text-secondary transition-colors duration-300" href="#">Documentation</a>
                        <a className="text-[#E3E2E5]/50 hover:text-secondary transition-colors duration-300" href="#">Privacy Policy</a>
                        <a className="text-[#E3E2E5]/50 hover:text-secondary transition-colors duration-300" href="#">Security</a>
                        <a className="text-[#E3E2E5]/50 hover:text-secondary transition-colors duration-300" href="#">Terms of Service</a>
                    </div>
                    <div className="text-[#E3E2E5]/50 text-xs text-center md:text-right">
                        © 2026 MineSafe-v2. Built under UnderGrid AI.
                    </div>
                </div>
            </footer>
        </div>
    );
}
