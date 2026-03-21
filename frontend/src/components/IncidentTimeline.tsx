import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle, User, MapPin } from "lucide-react";
import { useSimContext } from "@/context/SimContext";

type Filter = "all" | "active" | "resolved";

export default function IncidentTimeline() {
    const { simAlerts } = useSimContext();
    const [filter, setFilter] = useState<Filter>("all");
    const [resolved, setResolved] = useState<Set<string>>(new Set());

    const resolve = (id: string) => setResolved(prev => new Set([...prev, id]));
    const clearResolved = () => setResolved(new Set());

    const filtered = useMemo(() => {
        return simAlerts.filter(a => {
            if (filter === "active") return !resolved.has(a.id);
            if (filter === "resolved") return resolved.has(a.id);
            return true;
        });
    }, [simAlerts, filter, resolved]);

    const ago = (ts: number | string) => {
        const timeValue = typeof ts === 'string' ? new Date(ts).getTime() : ts;
        const s = Math.floor((Date.now() - timeValue) / 1000);
        if (s < 60) return `${s}s ago`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        return `${Math.floor(m / 60)}h ago`;
    };

    const riskColor: Record<string, string> = {
        critical: "#ff3333",
        high: "#ff6600",
        medium: "#ffaa00",
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="glass-card-accent p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Incident History</h2>
                            <p className="text-[13px] text-white/35 mt-0.5">
                                {simAlerts.length} total · {simAlerts.length - resolved.size} active — live simulation data
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
                            {(["all", "active", "resolved"] as Filter[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-accent/10 text-accent shadow-[0_0_10px_rgba(239,136,82,0.1)]" : "text-white/35 hover:text-white/60"}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        {resolved.size > 0 && (
                            <button onClick={clearResolved} className="btn-ghost text-xs px-3 py-1.5 text-white/30">
                                Clear Resolved
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-white/10" />
                    <h3 className="text-lg font-semibold text-white/30 mb-1">
                        {simAlerts.length === 0 ? "No incidents yet" : "No incidents match current filter"}
                    </h3>
                    <p className="text-[13px] text-white/20">
                        {simAlerts.length === 0
                            ? "Start the simulation on Overview — incidents are logged when miners enter danger zones."
                            : "Try changing the filter above."}
                    </p>
                </div>
            )}

            {/* Timeline */}
            {filtered.length > 0 && (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/[0.06]" />

                    <div className="space-y-3">
                        <AnimatePresence>
                            {filtered.map((inc, idx) => {
                                const isResolved = resolved.has(inc.id);
                                const color = riskColor[inc.riskLevel] || "#ffaa00";
                                return (
                                    <motion.div
                                        key={inc.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                        className="flex gap-4 relative"
                                    >
                                        {/* Timeline dot */}
                                        <div className="flex-shrink-0 w-[46px] flex justify-center pt-4 z-10">
                                            <div className="w-3 h-3 rounded-full border-2 border-[#050505]"
                                                style={{ background: isResolved ? "#EF8852" : color }} />
                                        </div>

                                        {/* Card */}
                                        <div className={`flex-1 glass-card p-4`}
                                            style={!isResolved ? { borderLeftColor: `${color}50`, borderLeftWidth: "2px" } : {}}>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[13px] font-semibold">{inc.minerName}</span>
                                                        <span className="text-[11px] text-white/25 px-1.5 py-0.5 rounded bg-white/[0.03]">
                                                            {inc.workerId}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                                            style={{ background: `${color}15`, color }}>
                                                            {inc.riskLevel.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-white/40">
                                                        Entered <span className="text-white/60 font-medium">{inc.zoneName}</span>
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isResolved ? (
                                                        <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Resolved
                                                        </span>
                                                    ) : (
                                                        <button onClick={() => resolve(inc.id)}
                                                            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                                                            <CheckCircle className="w-3 h-3" /> Resolve
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-white/25">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {ago(inc.time)}
                                                </span>
                                                <span className="flex items-center gap-1 font-mono">
                                                    <MapPin className="w-3 h-3" />
                                                    {inc.lat.toFixed(4)}°N, {inc.lng.toFixed(4)}°E
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
