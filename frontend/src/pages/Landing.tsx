import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Shield, MapPin, Bell, Brain, Activity, ArrowRight,
    Wifi, Satellite, HardHat, BarChart3, Github,
    Lock, Zap, Globe, Cpu, ShieldCheck
} from "lucide-react";

const TRUCK_IMAGE = "/images/landing_truck.png";
const MINER_IMAGE = "/images/landing_miner.png";

const pillars = [
    { title: "Revolutionize Your", desc: "Revolutionize your industrial mining processes with our advanced real-time AI and location heuristics." },
    { title: "Uncompromising Safety", desc: "Implement zero-compromise safety protocols using IoT networks and multi-sensor fusion." },
    { title: "Scaleable Intelligence", desc: "Manage massive underground operations through centralized AI command and automated alerts." },
];

const cards = [
    { icon: Lock, title: "Secure Your Operations", desc: "Automated threat detection and instantaneous communication networks ensure total security." },
    { icon: Zap, title: "Real-Time Precision", desc: "Sub-second latency in hazard detection ensures immediate response to imminent threats." },
];

const solutions = [
    { icon: MapPin, title: "Real-Time Tracking", desc: "Live location tracking for every miner." },
    { icon: Bell, title: "Instant Alerts", desc: "Emergency notifications to supervisors." },
    { icon: Brain, title: "ML Heatmaps", desc: "AI-powered geological deformation analysis." },
    { icon: BarChart3, title: "Predictive Analytics", desc: "Predict structural stress scenarios." },
    { icon: Shield, title: "Hazard Detection", desc: "Monitors proximity to unstable zones." },
    { icon: Activity, title: "System Observability", desc: "Complete production monitoring." },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-surface-deep text-text-primary selection:bg-accent/30 overflow-x-hidden font-sans">
            
            {/* ─── Navbar ─── */}
            <nav className="fixed top-0 w-full z-50 bg-surface-deep border-b border-accent/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                            <HardHat className="w-5 h-5 text-surface-deep" />
                        </div>
                        <span className="text-xl font-black lowercase tracking-tight">undergrid.ai</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-text-secondary">
                        <a href="#solutions" className="hover:text-amber-400 transition-colors">Solutions</a>
                        <a href="#about" className="hover:text-amber-400 transition-colors">Technology</a>
                        <a href="#pricing" className="hover:text-amber-400 transition-colors">About</a>
                        <a href="https://github.com/RishitPradhan/UnderGrid" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">Source</a>
                    </div>
                    <Link to="/dashboard" className="px-6 py-2.5 rounded shadow-glow bg-accent text-surface-deep font-black text-[13px] hover:bg-amber-400 transition-colors">
                        COMMAND CENTER
                    </Link>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <section className="pt-32 pb-20 bg-surface-deep relative">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-xl">
                        <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-6 text-accent">
                            Discover the
                            <br />
                            Future of
                            <br />
                            Mining Safety
                        </h1>
                        <p className="text-lg text-text-secondary mb-8 font-medium">
                            Harnessing real-time IoT networks and AI-powered heuristics to create the world's most advanced underground safety ecosystem.
                        </p>
                        <Link to="/dashboard" className="inline-flex px-8 py-4 rounded bg-accent text-surface-deep shadow-glow font-black text-sm uppercase hover:bg-amber-400 transition-colors">
                            LEARN MORE
                        </Link>
                    </div>
                    <div className="relative">
                        <img 
                            src={TRUCK_IMAGE} 
                            alt="Orange Mining Truck" 
                            className="w-full h-auto object-contain rounded-xl"
                            onError={(e) => {
                                // Fallback if image not found
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-[400px] rounded-xl bg-surface-elevated border border-accent/20 flex items-center justify-center"><span class="text-accent/50 font-bold">Truck Asset Placeholder</span></div>';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ─── Pillars Section ─── */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 border-t border-gray-200 pt-16">
                    {pillars.map((p, i) => (
                        <div key={i} className="flex flex-col">
                            <h3 className="text-xl font-black text-gray-900 mb-4">{p.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Feature 1: Secure Your Mining ─── */}
            <section className="py-24 bg-surface-deep relative">
                {/* Visual split: Background behind miner is orange in the mock up. We'll simulate by wrapping the image */}
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-accent rounded-[3rem] -z-10 transform -rotate-3 blur-[2px]" />
                        <img 
                            src={MINER_IMAGE} 
                            alt="Miner Character" 
                            className="w-full h-auto max-w-md mx-auto object-contain drop-shadow-2xl"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-[500px] rounded-[3rem] bg-accent border border-white/20 flex items-center justify-center"><span class="text-surface-deep font-bold">Miner Asset Placeholder</span></div>';
                            }}
                        />
                    </div>

                    <div className="flex flex-col relative z-20">
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                            Secure Your Mining
                        </h2>
                        <p className="text-text-secondary text-lg mb-10">
                            Engineering zero-compromise safety protocols using real-time IoT networks, 
                            ensuring total oversight over the deepest operations on earth.
                        </p>
                        
                        <div className="flex items-center gap-6 mb-16">
                            <Link to="/dashboard" className="px-8 py-3 rounded bg-accent text-surface-deep font-black text-sm uppercase shadow-glow hover:bg-amber-400 transition-colors">
                                LEARN MORE
                            </Link>
                            <Link to="/about" className="text-white font-bold text-sm uppercase hover:text-accent transition-colors flex items-center gap-2">
                                Read Docs <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Overlapping White Cards */}
                        <div className="flex flex-col gap-6">
                            {cards.map((card, i) => (
                                <div key={i} className="bg-white p-6 md:p-8 rounded-xl shadow-2xl flex gap-6 items-start -ml-0 lg:-ml-24 hover:translate-x-4 transition-transform z-30 border border-gray-100">
                                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                                        <card.icon className="w-6 h-6 text-accent" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-2">{card.title}</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Feature 2: Revolutionize Your Mining ─── */}
            <section className="py-32 bg-surface-deep border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-surface-elevated/20 skew-x-12" />
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                            Revolutionize
                            <br />
                            Your Mining
                        </h2>
                        <p className="text-text-secondary text-lg mb-10">
                            Automated heuristics and machine learning integrations identify geometric faults before they materialize into disasters.
                        </p>
                        <Link to="/dashboard" className="inline-flex px-8 py-3 rounded bg-accent text-surface-deep shadow-glow font-black text-sm uppercase hover:bg-amber-400 transition-colors">
                            LEARN MORE
                        </Link>
                    </div>
                    {/* Placeholder for Cave Asset since quota failed */}
                    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center border border-accent/10 shadow-2xl">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        <div className="text-center relative z-10 px-8">
                            <ShieldCheck className="w-16 h-16 text-accent mx-auto mb-6 opacity-80" />
                            <span className="text-accent/60 font-bold uppercase tracking-widest text-sm block mb-2">3D Cave & Vehicles Asset</span>
                            <span className="text-text-secondary text-xs">Waiting for generation quota</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Feature 3: Unlock The Power ─── */}
            <section className="py-32 bg-accent relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
                    {/* Placeholder for Mech Asset */}
                    <div className="relative w-full h-[500px] flex items-center justify-center">
                        <div className="w-[80%] h-[90%] bg-surface-deep rounded-[3rem] shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 border border-white/10">
                            <div className="text-center px-8">
                                <Activity className="w-16 h-16 text-accent mx-auto mb-6 opacity-80" />
                                <span className="text-accent font-bold uppercase tracking-widest text-sm block mb-2">3D Mech Suit Asset</span>
                                <span className="text-white/40 text-xs">Waiting for generation quota</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-surface-deep">
                        <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
                            Unlock the <br /> Power of AI
                        </h2>
                        <p className="text-surface-deep/80 text-lg mb-10 font-bold pr-12">
                            Deploy tactical drones, automate emergency shutdown sequences, and harness generative AI models directly from your command terminal.
                        </p>
                        <div className="flex flex-col gap-4 max-w-xs">
                            <Link to="/dashboard" className="px-8 py-4 rounded bg-surface-deep text-accent font-black text-sm uppercase text-center hover:bg-surface transition-colors shadow-lg">
                                COMMAND HUB
                            </Link>
                            <Link to="/about" className="px-8 py-4 rounded bg-transparent border-2 border-surface-deep text-surface-deep font-black text-sm uppercase text-center hover:bg-surface-deep/10 transition-colors">
                                LEARN MORE
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Solutions Grid ─── */}
            <section id="solutions" className="py-32 bg-surface-deep relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                            Empowering the Next Generation of Miners
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {solutions.map((sol, i) => (
                            <div key={i} className="bg-surface border border-white/5 p-8 rounded-2xl hover:bg-surface-elevated/40 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded bg-surface-deep border border-accent/20 flex items-center justify-center mb-6">
                                    <sol.icon className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{sol.title}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">{sol.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="bg-surface py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 text-sm">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                                <HardHat className="w-5 h-5 text-surface-deep" />
                            </div>
                            <span className="text-xl font-black lowercase tracking-tight text-white">undergrid.ai</span>
                        </Link>
                        <p className="text-text-secondary max-w-sm mb-6">
                            Architecting the future of industrial safety through autonomous IoT networks.
                        </p>
                        <div className="text-white/30 text-xs text-text-secondary">© 2026 Undergrid Co. All rights reserved.</div>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-6">System</h4>
                        <ul className="space-y-4 text-text-secondary">
                            <li><Link to="/dashboard" className="hover:text-accent transition-colors">Command Center</Link></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Analytics</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Alerts</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-text-secondary">
                            <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-6">Connect</h4>
                        <ul className="space-y-4 text-text-secondary">
                            <li><a href="https://github.com/RishitPradhan/UnderGrid" className="hover:text-accent transition-colors flex items-center gap-2"><Github className="w-4 h-4"/> GitHub</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Twitter</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

