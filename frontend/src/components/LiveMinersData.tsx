import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, HardHat, MapPin, Clock, RefreshCw, AlertTriangle,
    Wifi, WifiOff, Activity, Map, List
} from "lucide-react";
import MinersMap from "./MinersMap";
import { useSimContext } from "@/context/SimContext";

export interface Worker {
    _id: string;
    name: string;
    workerId: string;
    helmetId: string;
    role: string;
    currentLocation: { type: string; coordinates: [number, number]; timeStamp: string };
    lastUpdated: string;
    riskZone?: boolean;
    __v: number;
}

const roleColors: Record<string, string> = {
    miner: "#EF8852", engineer: "#AB7E75", "safety officer": "#82463C",
    electrician: "#f3a57b", welder: "#d97706", plumber: "#a78bfa",
    operator: "#8b5cf6", technician: "#ec4899",
};

export default function LiveMinersData() {
    const { simMiners } = useSimContext();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("");
    const [view, setView] = useState<"list" | "map">("list");

    // Sync from simulation context to Worker format
    useEffect(() => {
        if (simMiners.length > 0) {
            const mappedWorkers: Worker[] = simMiners.map(m => ({
                _id: m.id,
                name: m.name,
                workerId: m.workerId,
                helmetId: `H${m.workerId.replace('W', '')}`,
                role: m.role,
                currentLocation: {
                    type: "Point",
                    coordinates: [m.lng, m.lat], // GeoJSON is [lng, lat]
                    timeStamp: new Date().toISOString()
                },
                lastUpdated: new Date().toISOString(),
                riskZone: m.inDanger,
                __v: 0
            }));
            setWorkers(mappedWorkers);
            setIsOnline(true);
            setLastUpdate(new Date().toLocaleTimeString());
        }
    }, [simMiners]);

    const fetchData = () => {
        // Just a dummy refresh for UI feedback since it's already real-time streamed
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const getStatus = (ts: string) => {
        const m = Math.floor((Date.now() - Date.parse(ts)) / 60000);
        if (m < 5) return { label: "Active", color: "#EF8852" };
        if (m < 30) return { label: "Recent", color: "#AB7E75" };
        return { label: "Inactive", color: "#82463C" };
    };

    const rc = (role: string) => roleColors[role.toLowerCase()] || "#6b7280";

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="glass-card-accent p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center shadow-lg">
                            <Users className="w-7 h-7 text-surface-deep" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                                Worker Tracking
                                <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-bold">{workers.length} Active</span>
                            </h2>
                            <p className="text-accent-muted font-bold uppercase tracking-widest text-[10px] mt-1">Real-time locations and status</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                            <button onClick={() => setView("list")} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${view === "list" ? "bg-accent/10 text-accent" : "text-white/40 hover:text-white"}`}>
                                <List className="w-4 h-4 inline mr-1" /> List
                            </button>
                            <button onClick={() => setView("map")} className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${view === "map" ? "bg-accent/10 text-accent shadow-[0_0_10px_rgba(239,136,82,0.1)]" : "text-white/35 hover:text-white/60"}`}>
                                <Map className="w-4 h-4 inline mr-1" /> Map
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/10 text-[10px] font-black uppercase tracking-widest">
                            {isOnline ? <Wifi className="w-3.5 h-3.5 text-accent" /> : <WifiOff className="w-3.5 h-3.5 text-accent-muted" />}
                            <span className={isOnline ? "text-accent" : "text-accent-muted"}>{isOnline ? "Live" : "Demo"}</span>
                        </div>
                        <button onClick={fetchData} disabled={loading}
                            className="btn-ghost text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Workers", value: workers.length, color: "#EF8852", icon: Users },
                    { label: "Active Now", value: workers.filter(w => getStatus(w.lastUpdated).label === "Active").length, color: "#EF8852", icon: Activity },
                    { label: "Job Roles", value: new Set(workers.map(w => w.role)).size, color: "#AB7E75", icon: HardHat },
                    { label: "Safety Staff", value: workers.filter(w => w.role.toLowerCase().includes("safety")).length, color: "#AB7E75", icon: AlertTriangle },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs text-white/40 mt-1">{s.label}</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content */}
            {view === "map" ? (
                <MinersMap workers={workers} isOnline={isOnline} lastUpdate={lastUpdate} onRefresh={fetchData} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {workers.map((w, i) => {
                            const st = getStatus(w.lastUpdated);
                            return (
                                <motion.div key={w._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}>
                                    <div className="glass-card p-5 group hover:border-white/[0.08]" style={{ borderLeft: `2px solid ${rc(w.role)}40` }}>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                    style={{ background: `${rc(w.role)}15`, border: `1px solid ${rc(w.role)}30` }}>
                                                    <HardHat className="w-6 h-6" style={{ color: rc(w.role) }} />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                                                    style={{ background: st.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-base">{w.name}</h3>
                                                <p className="text-xs text-white/40">ID: {w.workerId} · Helmet: {w.helmetId}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/30">Role</span>
                                                <span className="px-2 py-0.5 rounded-full text-[11px]"
                                                    style={{ background: `${rc(w.role)}15`, color: rc(w.role), border: `1px solid ${rc(w.role)}30` }}>{w.role}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/30">Status</span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                                                    <span style={{ color: st.color }}>{st.label}</span>
                                                </span>
                                            </div>
                                            {w.currentLocation?.coordinates && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/30">Location</span>
                                                    <span className="text-[11px] text-accent font-black uppercase tracking-widest flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {w.currentLocation.coordinates[1].toFixed(4)}°N, {w.currentLocation.coordinates[0].toFixed(4)}°E
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/30">Updated</span>
                                                <span className="text-white/50 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {(() => {
                                                        const m = Math.floor((Date.now() - Date.parse(w.lastUpdated)) / 60000);
                                                        return m < 1 ? "Just now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
