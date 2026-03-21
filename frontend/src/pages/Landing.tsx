import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Shield, Radio, MapPin, Bell, Brain, Activity, ArrowRight,
    Wifi, Satellite, HardHat, AlertTriangle, BarChart3, Github, ArrowUpRight,
    Lock, Zap, Globe, Cpu, Users, Workflow
} from "lucide-react";
import ExcavatorAnimation from "../components/ExcavatorAnimation";

const HERO_IMAGE = "/C:/Users/prach/.gemini/antigravity/brain/e501e584-5f25-4286-835d-688044eedd21/mining_hero_background_1773642379866.png";

const features = [
    { icon: MapPin, title: "Real-Time Tracking", desc: "GPS + RFID powered live location tracking for every miner underground with sub-meter accuracy.", color: "#00d4ff" },
    { icon: AlertTriangle, title: "Hazard Zone Detection", desc: "Haversine distance monitoring with 20m threshold alerts when workers approach unstable zones.", color: "#ef4444" },
    { icon: Bell, title: "Instant SMS Alerts", desc: "Twilio-powered emergency notifications sent to supervisors when workers enter risk zones.", color: "#f59e0b" },
    { icon: Brain, title: "ML Heatmaps", desc: "AI-powered geological deformation analysis with interactive heatmaps from satellite data.", color: "#a855f7" },
    { icon: BarChart3, title: "Predictive Analytics", desc: "Machine learning models predict land displacement with actual vs predicted visualization.", color: "#34d399" },
    { icon: Activity, title: "System Observability", desc: "Prometheus metrics + Winston-Loki logging for complete production monitoring.", color: "#ec4899" },
];

const pillars = [
    { icon: Lock, title: "Uncompromising Safety", desc: "Engineering zero-compromise safety protocols using real-time IoT networks." },
    { icon: Zap, title: "Real-Time Precision", desc: "Sub-second latency in hazard detection ensures immediate response to threats." },
    { icon: Globe, title: "Scaleable Intelligence", desc: "Managing massive underground operations through centralized AI command." },
];

const stats = [
    { label: "Personnel Tracked", value: "2,400+" },
    { label: "Active Nodes", value: "15,000+" },
    { label: "Safety Alerts", value: "99.9%" },
    { label: "Response Time", value: "<1s" },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#020408] text-white selection:bg-cyan-500/30">
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 w-full z-50 bg-[#020408]/80 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                            <HardHat className="w-5 h-5 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[17px] font-bold tracking-tight leading-none uppercase">undergrid<span className="text-cyan-400">.ai</span></span>
                            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1 font-medium">Mine Intelligence</span>
                        </div>
                    </Link>
                    <div className="hidden lg:flex items-center gap-10 text-[13px] font-semibold uppercase tracking-widest text-white/50">
                        <a href="#solutions" className="hover:text-cyan-400 transition-colors">Solutions</a>
                        <a href="#technology" className="hover:text-cyan-400 transition-colors">Technology</a>
                        <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
                        <a href="https://github.com/RishitPradhan/UnderGrid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Github className="w-4 h-4" /> Open Source
                        </a>
                    </div>
                    <Link to="/dashboard" className="group text-[12px] font-bold uppercase tracking-widest text-black bg-cyan-400 hover:bg-cyan-300 px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-cyan-400/20 active:scale-95">
                        Command Center
                    </Link>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden">
                {/* Background Image with Parallax-like effect */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={HERO_IMAGE}
                        alt="Mining Facility"
                        className="w-full h-full object-cover scale-105 opacity-40 mix-blend-luminosity grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020408] via-[#020408]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-[#020408]/60" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-8">
                            <Shield className="w-3.5 h-3.5" /> Industrial Grade Security
                        </div>
                        <h1 className="text-5xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-8 uppercase italic">
                            Redefining
                            <br />
                            <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">Safety</span>
                            <br />
                            Underground
                        </h1>
                        <p className="text-lg lg:text-xl text-white/40 max-w-lg mb-10 leading-relaxed font-medium">
                            The industry standard for real-time personnel tracking and hazard prevention. 
                            Engineered for high-stakes mining environments where every second counts.
                        </p>
                        <div className="flex flex-wrap items-center gap-5">
                            <Link to="/dashboard" className="group bg-cyan-400 text-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-white transition-all shadow-2xl shadow-cyan-400/10 active:scale-95">
                                Enterprise Portal <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#solutions" className="px-10 py-5 rounded-full border border-white/10 font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all active:scale-95">
                                View Solutions
                            </a>
                        </div>
                    </motion.div>

                    {/* Industrial Stats Column */}
                    <div className="hidden lg:grid grid-cols-2 gap-4">
                        {stats.map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md hover:border-cyan-400/30 transition-all cursor-default group"
                            >
                                <div className="text-3xl font-black text-cyan-400 mb-1 group-hover:scale-110 transition-transform origin-left">{s.value}</div>
                                <div className="text-[11px] font-bold uppercase tracking-widest text-white/30">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pillars Section ─── */}
            <section className="py-32 relative overflow-hidden bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 relative z-10">
                    {pillars.map((p, i) => (
                        <motion.div
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#12151c] border border-white/5 flex items-center justify-center mb-8 shadow-xl group-hover:border-cyan-400/50 transition-all group-hover:scale-110">
                                <p.icon className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter">{p.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed max-w-xs">{p.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── Solutions Grid ─── */}
            <section id="solutions" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mb-24">
                        <div className="text-cyan-400 font-black uppercase tracking-[0.3em] text-[12px] mb-4">Enterprise Solutions</div>
                        <h2 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                            Integrated Mining
                            <br />
                            Intelligence
                        </h2>
                        <div className="w-20 h-2 bg-cyan-400 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="group p-10 rounded-[2.5rem] bg-[#12151c] border border-white/[0.03] hover:border-cyan-400/20 transition-all hover:translate-y-[-8px] relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <f.icon className="w-24 h-24" style={{ color: f.color }} />
                                </div>
                                
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-inner"
                                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                                    <f.icon className="w-7 h-7" style={{ color: f.color }} />
                                </div>
                                <h3 className="text-[17px] font-black mb-4 uppercase italic tracking-tight">{f.title}</h3>
                                <p className="text-[14px] text-white/30 font-medium leading-relaxed">{f.desc}</p>
                                
                                <div className="mt-10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                    Learn More <ArrowRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Technology Strip ─── */}
            <section id="technology" className="py-24 border-y border-white/[0.05] bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-12 opacity-40">
                    {[
                        { icon: Satellite, text: "InSAR Satellite Data" },
                        { icon: Cpu, text: "LLM Edge Computing" },
                        { icon: Wifi, text: "RFID Mesh Networks" },
                        { icon: Lock, text: "Encrypted Comms" },
                        { icon: Globe, text: "Geospatial GIS" }
                    ].map((t) => (
                        <div key={t.text} className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all">
                            <t.icon className="w-6 h-6" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{t.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Final CTA ─── */}
            <section className="py-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-400/5 mix-blend-overlay" />
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-5xl lg:text-9xl font-black uppercase italic tracking-tighter mb-12">
                        Command the
                        <br />
                        <span className="text-cyan-400 tracking-[-0.05em] drop-shadow-[0_0_50px_rgba(34,211,238,0.2)] underline decoration-white/10 underline-offset-[20px]">UnderGrid</span>
                    </h2>
                    <p className="text-xl text-white/40 mb-12 max-w-2xl mx-auto font-medium">
                        Deploy the world's most advanced mining safety platform in your facility today.
                    </p>
                    <Link to="/dashboard" className="px-16 py-8 rounded-full bg-white text-black font-black uppercase tracking-widest text-lg hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-2xl">
                        Launch Enterprise Portal
                    </Link>
                </div>
            </section>

            {/* ─── Excavator Animation ─── */}
            <ExcavatorAnimation />

            {/* ─── Footer ─── */}
            <footer className="bg-[#0a0c10] py-24 border-t border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center">
                                <HardHat className="w-6 h-6 text-black" />
                            </div>
                            <span className="text-2xl font-black uppercase italic tracking-tighter italic">undergrid<span className="text-cyan-400">.ai</span></span>
                        </div>
                        <p className="text-white/20 text-sm max-w-sm leading-relaxed font-medium">
                            Propelling mining safety into the future through autonomous tracking, AI heuristics, and real-time geological analysis.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-[11px] text-cyan-400 mb-8">Navigation</h4>
                        <div className="flex flex-col gap-4 text-sm font-bold text-white/30">
                            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
                            <a href="#technology" className="hover:text-white transition-colors">Technology</a>
                            <Link to="/dashboard" className="hover:text-white transition-colors text-cyan-400">Dashboard</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-[0.2em] text-[11px] text-cyan-400 mb-8">Platform</h4>
                        <div className="flex flex-col gap-4 text-sm font-bold text-white/30">
                            <a href="https://github.com/RishitPradhan/UnderGrid" className="hover:text-white transition-colors">GitHub Repository</a>
                            <span className="opacity-50">Hackathon v2.0</span>
                            <span className="opacity-50">© 2026 UnderGrid</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
