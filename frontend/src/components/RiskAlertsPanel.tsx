import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, HardHat, Activity, Search, Volume2, VolumeX } from "lucide-react";
import { useSimContext } from "@/context/SimContext";

export default function RiskAlertsPanel() {
    const { simMiners } = useSimContext();
    const [query, setQuery] = useState("");
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [crossLogs, setCrossLogs] = useState<{ id: string; name: string; zone: string; time: string; lat: number; lng: number }[]>([]);
    const prevDangerRef = useRef<Record<string, boolean>>({});

    const speak = useCallback((text: string) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95; u.pitch = 0.9; u.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    }, [voiceEnabled]);

    // Detect zone-entry transitions and append to supervisor log
    useEffect(() => {
        const events: typeof crossLogs = [];
        simMiners.forEach(m => {
            const was = prevDangerRef.current[m.id];
            const is = m.inDanger;
            if (!was && is) {
                events.push({ id: m.id, name: m.name, zone: m.dangerZone || "Unknown Zone", time: new Date().toISOString(), lat: m.lat, lng: m.lng });
                speak(`Warning: ${m.name} has entered ${m.dangerZone || "a hazard zone"}.`);
            }
            prevDangerRef.current[m.id] = is;
        });
        if (events.length) setCrossLogs(p => [...events, ...p].slice(0, 100));
    }, [simMiners, speak]);

    const riskMiners = useMemo(() => simMiners.filter(m => m.inDanger), [simMiners]);
    const safeMiners = useMemo(() => simMiners.filter(m => !m.inDanger), [simMiners]);
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return riskMiners.filter(m => !q || m.name.toLowerCase().includes(q) || m.workerId.toLowerCase().includes(q));
    }, [riskMiners, query]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`glass-card p-6 ${riskMiners.length > 0 ? "danger-pulse" : ""}`} style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-5 h-5" /> HAZARD ZONE ALERTS
                        </h2>
                        <p className="text-xs text-white/30 mt-1">Workers currently inside hazard zones — live simulation data</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
                                className="pl-8 h-8 w-40 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/30 text-white placeholder:text-white/30" />
                        </div>
                        <button onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 ${voiceEnabled ? "text-cyan-400 border-cyan-400/20" : "text-white/30"}`}>
                            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            {voiceEnabled ? "Voice On" : "Voice Off"}
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-400/10 border border-red-400/20">
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-sm font-semibold text-red-400">{riskMiners.length} IN HAZARD ZONE</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-400/10 border border-green-400/20">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-green-400">{safeMiners.length} Safe</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                        <span className="text-sm text-cyan-400">{simMiners.length} Total</span>
                    </div>
                    <span className="text-xs text-white/30 self-center">● Live</span>
                </div>

                {/* Risk Miner Cards */}
                {simMiners.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-sm">Start the Live Simulation on Overview to see live data</div>
                )}
                {simMiners.length > 0 && riskMiners.length === 0 && (
                    <div className="text-center py-8">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-green-400/50" />
                        <p className="text-green-400 font-medium">All Clear</p>
                        <p className="text-xs text-white/30 mt-1">No workers in hazard zones</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map(m => (
                            <motion.div key={m.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                                <div className="glass-card p-5 space-y-3" style={{ borderColor: "rgba(255,51,51,0.25)" }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center border"
                                                style={{ background: `${m.color}18`, borderColor: `${m.color}30` }}>
                                                <HardHat className="w-5 h-5" style={{ color: m.color }} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{m.name}</h3>
                                                <p className="text-xs text-white/30">{m.workerId} · {m.role}</p>
                                                <div className="flex items-center gap-1 mt-0.5 text-xs text-red-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {m.dangerZone || "HAZARD ZONE"}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.state === "panicked" ? "bg-red-400/20 text-red-400" : "bg-amber-400/20 text-amber-400"}`}>
                                            {m.state.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/10 text-xs font-mono text-white/60">
                                        <span className="text-white/30">Lat:</span> {m.lat.toFixed(6)}°N<br />
                                        <span className="text-white/30">Lng:</span> {m.lng.toFixed(6)}°E
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Safe Workers */}
                {safeMiners.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" /> Safe Workers
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {safeMiners.map(m => (
                                <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                                    <span className="text-white/60 truncate">{m.name}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 text-[11px]">Safe</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Supervisor Log */}
            <div className="glass-card p-6" style={{ borderColor: "rgba(255,170,0,0.2)" }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400" /> Supervisor Alert Log</h3>
                        <p className="text-xs text-white/30 mt-1">Zone-entry events from live simulation</p>
                    </div>
                    {crossLogs.length > 0 && <button onClick={() => setCrossLogs([])} className="btn-ghost text-xs px-3 py-1.5">Clear</button>}
                </div>
                {crossLogs.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-white/20" />
                        <p className="text-sm text-white/30">No entries recorded this session</p>
                    </div>
                ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2">
                        {crossLogs.map((log, i) => (
                            <div key={log.id + i} className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> ENTERED {log.zone.toUpperCase()}
                                    </span>
                                    <span className="text-[11px] text-white/30 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-white/70">{log.name}</div>
                                <div className="text-[11px] text-white/30 font-mono mt-1">{log.lat.toFixed(6)}°N, {log.lng.toFixed(6)}°E</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
