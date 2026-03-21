import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, RefreshCw, HardHat, Activity, Search, Shield, Volume2, VolumeX } from "lucide-react";

interface Worker {
    _id: string; name: string; workerId: string; helmetId: string; role: string;
    currentLocation: { type: string; coordinates: [number, number]; timeStamp: string };
    lastUpdated: string; riskZone?: boolean; __v: number;
}

const SERVER = "http://localhost:3000";

export default function RiskAlertsPanel() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [riskWorkers, setRiskWorkers] = useState<Worker[]>([]);
    const [safeWorkers, setSafeWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState("");
    const [query, setQuery] = useState("");
    const [crossLogs, setCrossLogs] = useState<{ uid: string; name: string; time: string; lat?: number; lng?: number }[]>([]);
    const prevRiskRef = useRef<Record<string, boolean>>({});
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // Voice alert function
    const speak = useCallback((text: string) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        window.speechSynthesis.cancel(); // cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled]);

    const fetch_ = async () => {
        try {
            setLoading(true); setError(null);
            const res = await axios.get(`${SERVER}/worker`, { timeout: 15000 });
            if (res.data.success && res.data.data) {
                const all: Worker[] = res.data.data;
                setWorkers(all);
                const risk = all.filter(w => Boolean(w.riskZone));
                const safe = all.filter(w => !w.riskZone);
                setRiskWorkers(risk); setSafeWorkers(safe);

                // Detect transitions
                const prev = prevRiskRef.current;
                const events: typeof crossLogs = [];
                all.forEach(w => {
                    const was = prev[w._id]; const is = Boolean(w.riskZone);
                    if (was === false && is) {
                        events.push({
                            uid: w._id, name: w.name || w.workerId, time: new Date().toISOString(),
                            lat: w.currentLocation?.coordinates?.[1], lng: w.currentLocation?.coordinates?.[0]
                        });
                        // Voice alert
                        speak(`Warning: ${w.name || w.workerId} has entered a hazard zone.`);
                    }
                    prev[w._id] = is;
                });
                if (events.length) setCrossLogs(p => [...events, ...p].slice(0, 100));
                setLastFetch(new Date().toLocaleTimeString());
            }
        } catch (e: any) {
            setError(e?.message?.includes("timeout") ? "Timeout" : "Failed to load");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetch_(); }, []);
    useEffect(() => { const id = setInterval(fetch_, 10000); return () => clearInterval(id); }, []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return riskWorkers.filter(w => !q || w.name?.toLowerCase().includes(q) || w.workerId?.toLowerCase().includes(q));
    }, [riskWorkers, query]);

    const ago = (ts: string) => {
        const s = Math.floor((Date.now() - Date.parse(ts)) / 1000);
        if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`; return `${Math.floor(m / 60)}h ago`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`glass-card p-6 ${riskWorkers.length > 0 ? "danger-pulse" : ""}`} style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-5 h-5" /> HAZARD ZONE ALERTS
                        </h2>
                        <p className="text-xs text-white/30 mt-1">Workers currently inside hazard zones</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
                                className="pl-8 h-8 w-40 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/30 text-white placeholder:text-white/30" />
                        </div>
                        <button onClick={fetch_} disabled={loading} className="btn-ghost text-xs px-3 py-1.5">
                            <RefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
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
                        <span className="text-sm font-semibold text-red-400">{riskWorkers.length} IN HAZARD ZONE</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-400/10 border border-green-400/20">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-green-400">{safeWorkers.length} Safe</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                        <span className="text-sm text-cyan-400">{workers.length} Total</span>
                    </div>
                    {lastFetch && <span className="text-xs text-white/30 self-center">Updated: {lastFetch}</span>}
                    {error && <span className="text-xs text-red-400 self-center">{error}</span>}
                </div>

                {/* Risk Worker Cards */}
                {loading && !riskWorkers.length && <div className="text-center py-8 text-white/30 text-sm">Loading risk data...</div>}
                {!loading && !riskWorkers.length && !error && (
                    <div className="text-center py-8">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-green-400/50" />
                        <p className="text-green-400 font-medium">All Clear</p>
                        <p className="text-xs text-white/30 mt-1">No workers in hazard zones</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map(w => (
                            <motion.div key={w._id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                                <div className="glass-card p-5 space-y-3" style={{ borderColor: "rgba(255,51,51,0.25)" }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                                                <HardHat className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{w.name || w.workerId}</h3>
                                                {w.role && <p className="text-xs text-white/30">{w.role}</p>}
                                                <div className="flex items-center gap-1 mt-0.5 text-xs text-red-400">
                                                    <AlertTriangle className="w-3 h-3" /> IN RISK ZONE
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-white/30">{ago(w.lastUpdated)}</span>
                                    </div>
                                    {w.currentLocation?.coordinates && (
                                        <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/10 text-xs font-mono text-white/60">
                                            <span className="text-white/30">Lat:</span> {w.currentLocation.coordinates[1].toFixed(6)}°N<br />
                                            <span className="text-white/30">Lng:</span> {w.currentLocation.coordinates[0].toFixed(6)}°E
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Safe Workers */}
                {safeWorkers.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" /> Safe Workers
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {safeWorkers.slice(0, 18).map(w => (
                                <div key={w._id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                                    <span className="text-white/60 truncate">{w.name || w.workerId}</span>
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
                        <p className="text-xs text-white/30 mt-1">Workers entering hazard zones</p>
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
                            <div key={log.uid + i} className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> ENTERED HAZARD ZONE
                                    </span>
                                    <span className="text-[11px] text-white/30 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-white/70">{log.name}</div>
                                {log.lat != null && log.lng != null && (
                                    <div className="text-[11px] text-white/30 font-mono mt-1">{log.lat.toFixed(6)}°N, {log.lng.toFixed(6)}°E</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
