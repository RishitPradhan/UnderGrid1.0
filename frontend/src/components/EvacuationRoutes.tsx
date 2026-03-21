import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, AlertTriangle, Zap, MapPin } from "lucide-react";
import axios from "axios";
import { useSimContext } from "@/context/SimContext";

const SERVER = "http://localhost:3000";

export default function EvacuationRoutes() {
    const { simMiners, simZones, simEvacRoutes, setSimEvacRoutes } = useSimContext();
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(false);

    const triggerEvac = async () => {
        setLoading(true);
        try {
            const miners = simMiners.map(m => ({ id: m.id, name: m.name, lat: m.lat, lng: m.lng }));
            const dangerZones = simZones.map(z => ({ polygon: z.polygon }));
            const res = await axios.post(`${SERVER}/evacuation/routes`, { miners, dangerZones });
            setSimEvacRoutes(res.data.routes);
            setActive(true);
        } catch (e) {
            console.error("Evacuation route error:", e);
        }
        setLoading(false);
    };

    const clearRoutes = () => {
        setSimEvacRoutes([]);
        setActive(false);
    };

    return (
        <div className="space-y-3">
            {/* Evac Button */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/20 flex items-center justify-center">
                            <Route className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">Emergency Evacuation</h3>
                            <p className="text-[10px] text-white/30">A* pathfinding to mine exit, avoiding hazards</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {active && (
                            <button onClick={clearRoutes}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold text-white/40 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                                Clear Routes
                            </button>
                        )}
                        <button onClick={triggerEvac} disabled={loading}
                            className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25 hover:shadow-[0_0_20px_rgba(255,50,50,0.15)] disabled:opacity-40 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {loading ? "CALCULATING..." : "ALL EVAC"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Routes List */}
            <AnimatePresence>
                {active && simEvacRoutes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-4"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-emerald-400" /> Escape Routes Active — {simEvacRoutes.length} miners
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {simEvacRoutes.map(route => (
                                <div key={route.minerId} className="p-2 rounded-lg bg-black/40 border border-emerald-400/10">
                                    <div className="text-[11px] font-bold text-white/70">{route.minerName}</div>
                                    <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-2.5 h-2.5" /> {(route as any).exitName || `${route.path.length} waypoints`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
