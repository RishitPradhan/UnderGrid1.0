import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Play, Square, AlertTriangle, Zap, ChevronRight, Radio } from "lucide-react";
import { useSimContext } from "@/context/SimContext";

/* ─────────────────────────────────────────
   Drone Deploy — Dashboard Overview Widget
   ───────────────────────────────────────── */

const DRONE_COLORS: Record<string, string> = {
    alpha: "#a855f7",
    beta: "#06b6d4",
    gamma: "#f59e0b",
};

const DRONE_NAMES = ["alpha", "beta", "gamma"];

export default function DroneDeploy() {
    const { simDrones, simMiners, simDronePlaying, setSimDronePlaying } = useSimContext();
    const [emergencyTarget, setEmergencyTarget] = useState<string | null>(null);

    const handleDeploy = () => {
        setSimDronePlaying(!simDronePlaying);
    };

    const handleEmergencyDispatch = (minerId: string) => {
        setEmergencyTarget(prev => prev === minerId ? null : minerId);
    };

    // Miners currently in danger
    const endangeredMiners = simMiners.filter(m => m.inDanger);

    // Merge live drone data with placeholders for each drone name
    const droneCards = DRONE_NAMES.map(name => {
        const live = simDrones.find(d => d.id === name);
        return {
            id: name,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            color: DRONE_COLORS[name],
            status: live?.status ?? (simDronePlaying ? "patrolling" : "idle"),
            lat: live?.lat,
        };
    });

    const activeCount = droneCards.filter(d => d.status !== "idle").length;
    const emergencyCount = droneCards.filter(d => d.status === "emergency").length;

    return (
        <div className="space-y-3">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                    Drone Fleet
                </h3>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent("navigate_section", { detail: "drone" }))}
                    className="text-[10px] text-white/25 hover:text-purple-400 transition-colors flex items-center gap-1"
                >
                    Full Control <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            {/* ─── Main Control Card ─── */}
            <div className="rounded-xl bg-black/40 border border-purple-500/10 p-4 space-y-4">

                {/* Deploy / Recall button row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${simDronePlaying ? "bg-purple-500/20 shadow-[0_0_16px_rgba(168,85,247,0.3)]" : "bg-white/5"}`}>
                            🛸
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-white/90">
                                {simDronePlaying ? `${activeCount} Drone${activeCount !== 1 ? "s" : ""} Active` : "Fleet on Standby"}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 ${simDronePlaying ? "text-purple-400" : "text-white/30"}`}>
                                {simDronePlaying ? (emergencyCount > 0 ? `⚠ ${emergencyCount} emergency` : "● Patrolling") : "○ Idle"}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDeploy}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${simDronePlaying
                            ? "bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25"
                            : "bg-purple-500/15 text-purple-400 border border-purple-400/30 hover:bg-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                            }`}
                    >
                        {simDronePlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        {simDronePlaying ? "RECALL ALL" : "DEPLOY ALL"}
                    </button>
                </div>

                {/* ─── Per-Drone Status Grid ─── */}
                <div className="grid grid-cols-3 gap-2">
                    {droneCards.map(drone => {
                        const isEmergency = drone.status === "emergency";
                        const isPatrolling = drone.status === "patrolling" || drone.status === "returning";
                        return (
                            <motion.div
                                key={drone.id}
                                layout
                                className={`relative rounded-lg p-2.5 border transition-all duration-300 ${isEmergency
                                    ? "bg-red-500/10 border-red-400/30"
                                    : isPatrolling
                                        ? "bg-black/50"
                                        : "bg-black/30 border-white/5"
                                    }`}
                                style={{ borderColor: isPatrolling && !isEmergency ? `${drone.color}25` : undefined }}
                            >
                                {isEmergency && (
                                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse rounded-t-lg" />
                                )}
                                {/* Top line glow when patrolling */}
                                {isPatrolling && !isEmergency && (
                                    <div className="absolute inset-x-0 top-0 h-[1px] rounded-t-lg opacity-40"
                                        style={{ background: `linear-gradient(to right, transparent, ${drone.color}, transparent)` }} />
                                )}
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div
                                        className={`w-2 h-2 rounded-full ${isEmergency ? "bg-red-400 animate-pulse" : isPatrolling ? "animate-pulse" : "bg-white/20"}`}
                                        style={{ backgroundColor: isPatrolling && !isEmergency ? drone.color : undefined }}
                                    />
                                    <span className="text-[11px] font-bold text-white/80">{drone.name}</span>
                                </div>
                                <div className={`text-[9px] font-mono font-bold uppercase ${isEmergency ? "text-red-400" : isPatrolling ? "text-emerald-400" : "text-white/25"}`}>
                                    {isEmergency ? "⚠ EMRG" : drone.status}
                                </div>
                                {drone.lat != null && (
                                    <div className="text-[8px] font-mono text-white/20 mt-0.5">
                                        {drone.lat.toFixed(4)}N
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* ─── Emergency Dispatch ─── */}
                <AnimatePresence>
                    {endangeredMiners.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-lg bg-red-500/8 border border-red-400/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                        Emergency Dispatch
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {endangeredMiners.map(miner => (
                                        <button
                                            key={miner.id}
                                            onClick={() => handleEmergencyDispatch(miner.id)}
                                            className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${emergencyTarget === miner.id
                                                ? "bg-red-500/30 border border-red-400/50 text-red-300"
                                                : "bg-red-500/10 border border-red-400/20 text-red-400/80 hover:bg-red-500/20"
                                                }`}
                                        >
                                            🛸 → {miner.name.split(" ")[0]}
                                        </button>
                                    ))}
                                    {emergencyTarget && (
                                        <button
                                            onClick={() => setEmergencyTarget(null)}
                                            className="text-[10px] px-2 py-1 rounded-lg font-bold bg-white/5 border border-white/10 text-white/30 hover:text-white/60"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Stats Footer ─── */}
                <div className="flex items-center gap-4 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                        <Radio className="w-3 h-3 text-purple-400" />
                        {droneCards.length} drones
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Scan: 200m radius
                    </span>
                    <span className={`ml-auto text-[10px] font-bold ${simDronePlaying ? "text-purple-400" : "text-white/20"}`}>
                        {simDronePlaying ? "● FLEET ACTIVE" : "○ STANDBY"}
                    </span>
                </div>
            </div>

            {/* ─── Link to full control ─── */}
            <div className="text-[10px] text-white/15 text-center">
                Live telemetry & patrol maps →{" "}
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent("navigate_section", { detail: "drone" }))}
                    className="text-purple-400/60 hover:text-purple-400 underline transition-colors"
                >
                    Drone Command Center
                </button>
            </div>
        </div>
    );
}
