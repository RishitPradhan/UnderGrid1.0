import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Heart, Thermometer, Wind, AlertTriangle, Radio, Shield } from "lucide-react";
import { useSimContext, type MinerVitals } from "@/context/SimContext";
import type { SimMiner } from "@/components/LiveMinerSimulation";

interface HelmetHUDProps {
    miner: SimMiner | null;
    onClose: () => void;
}

export default function HelmetHUD({ miner, onClose }: HelmetHUDProps) {
    const { simBiometrics, simZones } = useSimContext();
    const [scanline, setScanline] = useState(0);
    const [glitchActive, setGlitchActive] = useState(false);

    // Animate scanline
    useEffect(() => {
        if (!miner) return;
        const interval = setInterval(() => {
            setScanline(prev => (prev + 1) % 100);
        }, 30);
        return () => clearInterval(interval);
    }, [miner]);

    // Random glitch effect
    useEffect(() => {
        if (!miner) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.85) {
                setGlitchActive(true);
                setTimeout(() => setGlitchActive(false), 150);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [miner]);

    if (!miner) return null;

    const vitals = simBiometrics[miner.id];
    const nearbyZones = simZones.filter(z => {
        const cLat = z.polygon.reduce((s, p) => s + p[0], 0) / z.polygon.length;
        const cLng = z.polygon.reduce((s, p) => s + p[1], 0) / z.polygon.length;
        const dist = Math.sqrt(Math.pow(miner.lat - cLat, 2) + Math.pow(miner.lng - cLng, 2));
        return dist < 0.01;
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-[90vw] max-w-4xl h-[80vh] rounded-3xl overflow-hidden border-2 border-cyan-400/30 shadow-[0_0_60px_rgba(0,212,255,0.15)]"
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: "radial-gradient(ellipse at center, #0a1628 0%, #030810 70%, #000000 100%)",
                    }}
                >
                    {/* Scanline overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-40"
                        style={{
                            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.03) 2px, rgba(0,212,255,0.03) 4px)",
                        }}
                    />

                    {/* Moving scanline */}
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none z-20 transition-all duration-75"
                        style={{ top: `${scanline}%` }} />

                    {/* Glitch Effect */}
                    {glitchActive && (
                        <div className="absolute inset-0 z-30 pointer-events-none"
                            style={{
                                background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.05) 3px, rgba(0,255,136,0.05) 6px)",
                                transform: `translateX(${Math.random() * 10 - 5}px)`,
                            }} />
                    )}

                    {/* Close button */}
                    <button onClick={onClose}
                        className="absolute top-4 right-4 z-40 w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4 text-white/60" />
                    </button>

                    {/* Visor Frame */}
                    <div className="absolute inset-0 pointer-events-none z-10 rounded-3xl"
                        style={{
                            boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.6), inset 0 0 30px 10px rgba(0,20,40,0.4)",
                        }} />

                    {/* ─── HUD Content ─── */}
                    <div className="relative z-20 w-full h-full p-8 flex flex-col">

                        {/* Top Bar */}
                        <div className="flex items-center justify-between mb-auto">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <div className="text-sm font-bold text-cyan-400 font-mono tracking-wider">
                                        HELMET AR — {miner.name.toUpperCase()}
                                    </div>
                                    <div className="text-[10px] text-cyan-400/40 font-mono">{miner.workerId} • {miner.role}</div>
                                </div>
                            </div>
                            <div className="text-[10px] font-mono text-cyan-400/50">
                                {new Date().toLocaleTimeString()} UTC+5:30
                            </div>
                        </div>

                        {/* Center: Thermal Grid/Wireframe */}
                        <div className="flex-1 flex items-center justify-center relative my-6">
                            {/* Perspective grid */}
                            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 300" preserveAspectRatio="none">
                                {/* Horizontal lines (perspective) */}
                                {Array.from({ length: 12 }, (_, i) => {
                                    const y = 150 + (i - 6) * 20;
                                    const spread = Math.abs(i - 6) * 15;
                                    return <line key={`h${i}`} x1={spread} y1={y} x2={400 - spread} y2={y} stroke="#00d4ff" strokeWidth="0.5" opacity={0.3 + (1 - Math.abs(i - 6) / 6) * 0.4} />;
                                })}
                                {/* Vertical lines */}
                                {Array.from({ length: 10 }, (_, i) => {
                                    const x = 40 + i * 36;
                                    return <line key={`v${i}`} x1={x} y1={30} x2={x} y2={270} stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" />;
                                })}
                            </svg>

                            {/* Thermal blobs */}
                            <div className="absolute opacity-30"
                                style={{
                                    width: 180, height: 220,
                                    background: "radial-gradient(ellipse, #ff6600 0%, #ff3300 30%, #cc0000 60%, transparent 80%)",
                                    filter: "blur(20px)",
                                    left: "40%", top: "15%",
                                }} />
                            <div className="absolute opacity-20"
                                style={{
                                    width: 100, height: 120,
                                    background: "radial-gradient(ellipse, #ffaa00 0%, #ff6600 40%, transparent 80%)",
                                    filter: "blur(15px)",
                                    left: "25%", top: "35%",
                                }} />

                            {/* Center reticle */}
                            <div className="relative">
                                <div className="w-16 h-16 border border-cyan-400/30 rounded-full flex items-center justify-center">
                                    <div className="w-8 h-8 border border-cyan-400/50 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 -left-8 w-6 h-px bg-cyan-400/30" />
                                <div className="absolute top-1/2 -right-8 w-6 h-px bg-cyan-400/30" />
                                <div className="absolute -top-8 left-1/2 w-px h-6 bg-cyan-400/30" />
                                <div className="absolute -bottom-8 left-1/2 w-px h-6 bg-cyan-400/30" />
                            </div>
                        </div>

                        {/* Bottom HUD Overlay */}
                        <div className="flex items-end justify-between gap-6">
                            {/* Left: Vitals */}
                            <div className="space-y-2">
                                {vitals ? (
                                    <>
                                        <HUDVital icon={Heart} label="HR" value={`${vitals.heartRate.toFixed(0)} BPM`}
                                            color={vitals.heartRate > 110 ? "#ff3333" : "#00ff88"} />
                                        <HUDVital icon={Thermometer} label="TEMP" value={`${vitals.coreTemp.toFixed(1)}°C`}
                                            color={vitals.coreTemp > 38 ? "#ff3333" : "#00d4ff"} />
                                        <HUDVital icon={Wind} label="O₂" value={`${vitals.o2Level.toFixed(0)}%`}
                                            color={vitals.o2Level < 93 ? "#ff3333" : "#00ff88"} />
                                    </>
                                ) : (
                                    <div className="text-[10px] text-cyan-400/40 font-mono">VITALS: LOADING...</div>
                                )}
                            </div>

                            {/* Center: Status */}
                            <div className="text-center">
                                <div className="flex items-center gap-2 justify-center mb-1">
                                    <Shield className="w-4 h-4 text-cyan-400/60" />
                                    <span className={`text-xs font-mono font-bold ${miner.inDanger ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                                        {miner.inDanger ? "⚠ IN DANGER ZONE" : "✓ SAFE"}
                                    </span>
                                </div>
                                <div className="text-[9px] text-cyan-400/30 font-mono">
                                    {miner.lat.toFixed(5)}°N {miner.lng.toFixed(5)}°E
                                </div>
                            </div>

                            {/* Right: Nearby hazards */}
                            <div className="space-y-1.5">
                                <div className="text-[9px] text-cyan-400/40 font-mono uppercase">Hazards Nearby</div>
                                {nearbyZones.length === 0 && (
                                    <div className="text-[10px] text-emerald-400/50 font-mono">NONE DETECTED</div>
                                )}
                                {nearbyZones.map(z => (
                                    <div key={z.id} className="flex items-center gap-1.5 text-[10px] font-mono">
                                        <AlertTriangle className="w-3 h-3" style={{ color: z.color }} />
                                        <span style={{ color: z.color }}>{z.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function HUDVital({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: string; color: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-[9px] text-cyan-400/40 font-mono w-8">{label}</span>
            <span className="text-[11px] font-mono font-bold" style={{ color }}>{value}</span>
        </div>
    );
}
