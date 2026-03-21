import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fan, Power, RotateCcw, Wind, AlertTriangle, Zap } from "lucide-react";
import axios from "axios";
import { useSimContext, type FanState } from "@/context/SimContext";

const SERVER = "http://localhost:3000";

export default function VentilationControl() {
    const { simFans, setSimFans, simPurgeActive, setSimPurgeActive } = useSimContext();
    const [loading, setLoading] = useState(false);

    // Fetch fan states
    useEffect(() => {
        fetchFans();
    }, []);

    const fetchFans = async () => {
        try {
            const res = await axios.get(`${SERVER}/ventilation/fans`);
            setSimFans(res.data.fans);
            setSimPurgeActive(res.data.purge.active);
        } catch { }
    };

    const toggleFan = async (fanId: string) => {
        try {
            await axios.post(`${SERVER}/ventilation/toggle`, { fanId });
            fetchFans();
        } catch { }
    };

    const reverseFan = async (fanId: string) => {
        try {
            await axios.post(`${SERVER}/ventilation/reverse`, { fanId });
            fetchFans();
        } catch { }
    };

    const triggerPurge = async () => {
        setLoading(true);
        try {
            await axios.post(`${SERVER}/ventilation/purge`, { tunnelId: "main" });
            setSimPurgeActive(true);
            fetchFans();
            setTimeout(() => { setSimPurgeActive(false); fetchFans(); }, 10000);
        } catch { }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="glass-card-accent p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <Fan className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Ventilation Control</h2>
                            <p className="text-white/40 text-xs">Industrial fan management & gas purge system</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-mono font-bold ${simPurgeActive ? "bg-red-400/20 text-red-400 animate-pulse" : "bg-emerald-400/10 text-emerald-400"}`}>
                            {simPurgeActive ? "🔴 PURGE ACTIVE" : "● NOMINAL"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Purge Banner */}
            <AnimatePresence>
                {simPurgeActive && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                            <div>
                                <div className="text-sm font-bold text-red-400">TUNNEL PURGE IN PROGRESS</div>
                                <div className="text-[11px] text-white/50">All fans at maximum RPM. Gas evacuation underway.</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fan Cards */}
            <div className="grid grid-cols-2 gap-3">
                {simFans.map(fan => (
                    <div key={fan.id} className={`glass-card p-4 transition-all duration-300 ${fan.active ? "border-cyan-400/20" : "border-white/5 opacity-60"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fan.active ? "bg-cyan-400/15" : "bg-white/5"}`}>
                                    <Fan className={`w-4 h-4 ${fan.active ? "text-cyan-400 animate-spin" : "text-white/30"}`}
                                        style={{ animationDuration: fan.active ? `${Math.max(0.3, 1800 / fan.rpm)}s` : "0s" }} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-white/80">{fan.name}</div>
                                    <div className="text-[9px] text-white/30 font-mono">
                                        {fan.active ? `${fan.rpm} RPM${fan.reversed ? " (REV)" : ""}` : "OFF"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RPM Bar */}
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${fan.active ? (fan.rpm / 1800) * 100 : 0}%`,
                                    background: fan.rpm > 1500 ? "#ff3333" : fan.rpm > 1000 ? "#f59e0b" : "#00d4ff",
                                }} />
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2">
                            <button onClick={() => toggleFan(fan.id)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${fan.active
                                    ? "bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20"
                                    : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20"
                                    }`}>
                                <Power className="w-3 h-3 inline mr-1" />
                                {fan.active ? "STOP" : "START"}
                            </button>
                            <button onClick={() => reverseFan(fan.id)}
                                disabled={!fan.active}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
                                <RotateCcw className="w-3 h-3 inline mr-1" />
                                REVERSE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Emergency Purge Button */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> Emergency Tunnel Purge
                        </h3>
                        <p className="text-[11px] text-white/30 mt-1">Maximizes all fans & flushes toxic gases from all tunnels</p>
                    </div>
                    <button
                        onClick={triggerPurge}
                        disabled={simPurgeActive || loading}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 bg-gradient-to-r from-red-500/20 to-amber-500/20 text-amber-400 border border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-40"
                    >
                        <Wind className="w-4 h-4 inline mr-1.5" />
                        {simPurgeActive ? "PURGING..." : "INITIATE PURGE"}
                    </button>
                </div>
            </div>
        </div>
    );
}
