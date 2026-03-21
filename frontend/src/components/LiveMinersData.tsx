import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, HardHat, MapPin, Clock, RefreshCw, AlertTriangle,
    Wifi, WifiOff, Activity, Map, List
} from "lucide-react";
import MinersMap from "./MinersMap";

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

const SERVER = "http://localhost:3000";

const mockWorkers: Worker[] = [
    { _id: "m1", name: "Ravi Kumar", workerId: "W001", helmetId: "H001", role: "Miner", currentLocation: { type: "Point", coordinates: [82.5627, 22.3129], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m2", name: "Nirupon Pal", workerId: "W002", helmetId: "H002", role: "Miner", currentLocation: { type: "Point", coordinates: [82.5630, 22.3130], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m3", name: "John Doe", workerId: "W003", helmetId: "H003", role: "Engineer", currentLocation: { type: "Point", coordinates: [82.5620, 22.3128], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m4", name: "Priya Sharma", workerId: "W004", helmetId: "H004", role: "Safety Officer", currentLocation: { type: "Point", coordinates: [82.5628, 22.3130], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m5", name: "Amit Singh", workerId: "W005", helmetId: "H005", role: "Electrician", currentLocation: { type: "Point", coordinates: [82.5625, 22.3129], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m6", name: "Rajesh Patel", workerId: "W006", helmetId: "H006", role: "Operator", currentLocation: { type: "Point", coordinates: [82.5632, 22.3131], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m7", name: "Sunita Devi", workerId: "W007", helmetId: "H007", role: "Welder", currentLocation: { type: "Point", coordinates: [82.5629, 22.3129], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m8", name: "Vikram Singh", workerId: "W008", helmetId: "H008", role: "Technician", currentLocation: { type: "Point", coordinates: [82.5631, 22.3130], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
    { _id: "m9", name: "Anita Kumari", workerId: "W009", helmetId: "H009", role: "Plumber", currentLocation: { type: "Point", coordinates: [82.5627, 22.3129], timeStamp: new Date().toISOString() }, lastUpdated: new Date().toISOString(), __v: 0 },
];

const roleColors: Record<string, string> = {
    miner: "#00d4ff", engineer: "#3b82f6", "safety officer": "#00ff88",
    electrician: "#eab308", welder: "#f97316", plumber: "#06b6d4",
    operator: "#a855f7", technician: "#ec4899",
};

export default function LiveMinersData() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [lastUpdate, setLastUpdate] = useState("");
    const [view, setView] = useState<"list" | "map">("list");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${SERVER}/worker`, { timeout: 15000 });
            if (res.data.success && res.data.data) {
                setWorkers(res.data.data);
                setIsOnline(true);
            } else throw new Error("bad response");
        } catch {
            setIsOnline(false);
            if (workers.length === 0) setWorkers(mockWorkers);
        } finally {
            setLoading(false);
            setLastUpdate(new Date().toLocaleTimeString());
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { const id = setInterval(fetchData, 30000); return () => clearInterval(id); }, []);

    const getStatus = (ts: string) => {
        const m = Math.floor((Date.now() - Date.parse(ts)) / 60000);
        if (m < 5) return { label: "Active", color: "#00ff88" };
        if (m < 30) return { label: "Recent", color: "#ffaa00" };
        return { label: "Inactive", color: "#ff3333" };
    };

    const rc = (role: string) => roleColors[role.toLowerCase()] || "#6b7280";

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="glass-card-accent p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center">
                            <Users className="w-7 h-7 text-black" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                Worker Tracking
                                <span className="text-sm bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-full">{workers.length} Active</span>
                            </h2>
                            <p className="text-white/40 text-sm">Real-time locations and status</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                            <button onClick={() => setView("list")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "list" ? "bg-cyan-400/10 text-cyan-400" : "text-white/40 hover:text-white"}`}>
                                <List className="w-4 h-4 inline mr-1" /> List
                            </button>
                            <button onClick={() => setView("map")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "map" ? "bg-cyan-400/10 text-cyan-400" : "text-white/40 hover:text-white"}`}>
                                <Map className="w-4 h-4 inline mr-1" /> Map
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-xs">
                            {isOnline ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                            <span className={isOnline ? "text-green-400" : "text-red-400"}>{isOnline ? "Live" : "Demo"}</span>
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
                    { label: "Total Workers", value: workers.length, color: "#00d4ff", icon: Users },
                    { label: "Active Now", value: workers.filter(w => getStatus(w.lastUpdated).label === "Active").length, color: "#00ff88", icon: Activity },
                    { label: "Job Roles", value: new Set(workers.map(w => w.role)).size, color: "#3b82f6", icon: HardHat },
                    { label: "Safety Staff", value: workers.filter(w => w.role.toLowerCase().includes("safety")).length, color: "#ffaa00", icon: AlertTriangle },
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
                                                    <span className="font-mono text-white/60 flex items-center gap-1">
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
