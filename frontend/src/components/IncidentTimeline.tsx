import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle, RefreshCw, User, MapPin, Filter } from "lucide-react";

const SERVER = "http://localhost:3000";

interface Incident {
    _id: string;
    workerId: string;
    workerName: string;
    helmetId?: string;
    role?: string;
    location?: { coordinates: [number, number] };
    riskLevel: string;
    description: string;
    resolved: boolean;
    resolvedAt?: string;
    createdAt: string;
}

export default function IncidentTimeline() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${SERVER}/incidents?limit=50`, { timeout: 10000 });
            if (res.data.success) setIncidents(res.data.data);
        } catch {
            // silently fail, keep existing data
        } finally {
            setLoading(false);
        }
    };

    const resolveIncident = async (id: string) => {
        try {
            await axios.patch(`${SERVER}/incidents/${id}/resolve`);
            setIncidents(prev => prev.map(i => i._id === id ? { ...i, resolved: true, resolvedAt: new Date().toISOString() } : i));
        } catch { /* ignore */ }
    };

    useEffect(() => { fetchIncidents(); }, []);
    useEffect(() => { const id = setInterval(fetchIncidents, 15000); return () => clearInterval(id); }, []);

    const filtered = incidents.filter(i => {
        if (filter === "active") return !i.resolved;
        if (filter === "resolved") return i.resolved;
        return true;
    });

    const ago = (ts: string) => {
        const s = Math.floor((Date.now() - Date.parse(ts)) / 1000);
        if (s < 60) return `${s}s ago`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="glass-card-accent p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Incident History</h2>
                            <p className="text-[13px] text-white/35 mt-0.5">
                                {incidents.length} total · {incidents.filter(i => !i.resolved).length} active
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
                            {(["all", "active", "resolved"] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all capitalize ${filter === f ? "bg-cyan-400/10 text-cyan-400" : "text-white/35 hover:text-white/60"}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchIncidents} disabled={loading} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-white/10" />
                    <h3 className="text-lg font-semibold text-white/30 mb-1">No incidents recorded</h3>
                    <p className="text-[13px] text-white/20">Incidents are automatically logged when workers enter hazard zones.</p>
                </div>
            )}

            {/* Timeline */}
            {filtered.length > 0 && (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/[0.06]" />

                    <div className="space-y-3">
                        <AnimatePresence>
                            {filtered.map((inc, idx) => (
                                <motion.div
                                    key={inc._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex gap-4 relative"
                                >
                                    {/* Dot */}
                                    <div className="flex-shrink-0 w-[46px] flex justify-center pt-4 z-10">
                                        <div className={`w-3 h-3 rounded-full border-2 border-[#050505] ${inc.resolved ? "bg-emerald-400/60" : "bg-red-400"}`} />
                                    </div>

                                    {/* Card */}
                                    <div className={`flex-1 glass-card p-4 ${!inc.resolved ? "border-red-400/15" : ""}`}
                                        style={!inc.resolved ? { borderLeftColor: "rgba(239,68,68,0.3)", borderLeftWidth: "2px" } : {}}>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[13px] font-semibold">{inc.workerName || inc.workerId}</span>
                                                    {inc.role && <span className="text-[11px] text-white/25 px-1.5 py-0.5 rounded bg-white/[0.03]">{inc.role}</span>}
                                                </div>
                                                <p className="text-[12px] text-white/35">{inc.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {inc.resolved ? (
                                                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Resolved
                                                    </span>
                                                ) : (
                                                    <button onClick={() => resolveIncident(inc._id)}
                                                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                                                        <CheckCircle className="w-3 h-3" /> Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] text-white/25">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {ago(inc.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {inc.workerId}
                                            </span>
                                            {inc.location?.coordinates && (
                                                <span className="flex items-center gap-1 font-mono">
                                                    <MapPin className="w-3 h-3" />
                                                    {inc.location.coordinates[1]?.toFixed(4)}°N
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
