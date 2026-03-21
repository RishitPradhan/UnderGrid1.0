import { useState, useRef, useEffect, useCallback } from "react";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, MapPin, Users, AlertTriangle, ChevronLeft,
    Satellite, Wifi, Brain, HardHat, Activity, Menu, X,
    FileText, Clock, Crosshair, Terminal, RotateCcw
} from "lucide-react";
import LiveMinersData from "@/components/LiveMinersData";
import HeatmapViewer from "@/components/HeatmapViewer";
import RiskAlertsPanel from "@/components/RiskAlertsPanel";
import GeoZoneChart from "@/components/GeoZoneChart";
import SafetyReport from "@/components/SafetyReport";
import IncidentTimeline from "@/components/IncidentTimeline";
import DronePatrol from "@/components/DronePatrol";
import LiveMinerSimulation, {
    createInitialMiners, DANGER_ZONES, pointInPolygon,
    projectToNearestTunnel, TUNNEL_PATHS,
    type SimMiner, type SimAlertEntry
} from "@/components/LiveMinerSimulation";
import AITerminal from "@/components/AITerminal";
import GlobalAIPopup from "@/components/GlobalAIPopup";
import SeismicMonitor from "@/components/SeismicMonitor";
import VentilationControl from "@/components/VentilationControl";
import EvacuationRoutes from "@/components/EvacuationRoutes";
import { useSimContext } from "@/context/SimContext";




type Section = "overview" | "zones" | "miners" | "alerts" | "report" | "incidents" | "drone" | "ai-terminal" | "seismic" | "ventilation";

const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "zones", label: "Geo Zones", icon: MapPin },
    { id: "miners", label: "Miners", icon: Users },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "report", label: "AI Report", icon: FileText },
    { id: "incidents", label: "Incidents", icon: Clock },
    { id: "drone", label: "Drone", icon: Crosshair },
    { id: "seismic", label: "Seismic", icon: Activity },
    { id: "ventilation", label: "Ventilation", icon: HardHat },
    { id: "ai-terminal", label: "AI Terminal", icon: Terminal },
];

export default function Dashboard() {
    const [active, setActive] = useState<Section>("overview");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ─── Simulation state (lifted here for persistence across tabs) ───
    const [simMiners, setSimMiners] = useState<SimMiner[]>(createInitialMiners);
    const [simRunning, setSimRunning] = useState(false);
    const [simSpeed, setSimSpeed] = useState(0.5);
    const [simElapsed, setSimElapsed] = useState(0);
    const [simAlerts, setSimAlerts] = useState<SimAlertEntry[]>([]);
    const [simZones, setSimZones] = useState(DANGER_ZONES);
    const [simCommand, setSimCommand] = useState<{ type: 'none' | 'recall' | 'evacuate'; zoneId?: string }>({ type: 'none' });

    // ─── Sync sim state into global context for GlobalAIPopup ───
    const ctx = useSimContext();
    useEffect(() => { ctx.setSimMiners(simMiners); }, [simMiners]);
    useEffect(() => { ctx.setSimAlerts(simAlerts); }, [simAlerts]);
    useEffect(() => { ctx.setSimZones(simZones); }, [simZones]);

    // ─── Simulation engine (runs at Dashboard level, never unmounts) ───
    const prevDangerRef = useRef<Record<string, boolean>>({});
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const tick = useCallback(() => {
        // Dynamic Hazards Logic: Fluctuate zone sizes slightly
        setSimZones(prevZones => prevZones.map(zone => {
            const scale = 1 + Math.sin(Date.now() / 2000) * 0.05; // 5% pulse
            const centerLat = zone.polygon.reduce((sum, p) => sum + p[0], 0) / zone.polygon.length;
            const centerLng = zone.polygon.reduce((sum, p) => sum + p[1], 0) / zone.polygon.length;

            const newPolygon = zone.polygon.map(([lat, lng]) => [
                centerLat + (lat - centerLat) * scale,
                centerLng + (lng - centerLng) * scale
            ] as [number, number]);

            return { ...zone, polygon: newPolygon };
        }));

        setSimMiners(prev => {
            const newAlerts: SimAlertEntry[] = [];

            const updated = prev.map(m => {
                // State Tracking
                const newTicksActive = m.ticksActive + 1;
                const newTicksInDanger = m.inDanger ? m.ticksInDanger + 1 : 0;

                let newState: "normal" | "fatigued" | "panicked" = "normal";
                if (newTicksInDanger > 10) newState = "panicked";
                else if (newTicksActive > 300) newState = "fatigued";

                // Movement adjustments based on state
                let jitterMultiplier = 1;
                let speedMultiplier = 1;
                if (newState === "panicked") jitterMultiplier = 2.5;
                if (newState === "fatigued") speedMultiplier = 0.5;

                // Movement: Drift towards base + Jitter
                let baseLat = m.baseLat;
                let baseLng = m.baseLng;
                let pullStrength = 0.015; // Medium drift

                // Handle Commands
                if (simCommand.type === 'recall') {
                    baseLat = 20.9440; // Main Base center
                    baseLng = 85.2120;
                    pullStrength = 0.15; // Strong pull
                }

                const driftLat = (baseLat - m.lat) * pullStrength * speedMultiplier;
                const driftLng = (baseLng - m.lng) * pullStrength * speedMultiplier;

                // Evacuation vector
                let evasionLat = 0;
                let evasionLng = 0;
                if (simCommand.type === 'evacuate' && simCommand.zoneId) {
                    const zone = DANGER_ZONES.find(z => z.id === simCommand.zoneId);
                    if (zone) {
                        const centerLat = zone.polygon.reduce((sum, p) => sum + p[0], 0) / zone.polygon.length;
                        const centerLng = zone.polygon.reduce((sum, p) => sum + p[1], 0) / zone.polygon.length;
                        const dist = Math.sqrt(Math.pow(m.lat - centerLat, 2) + Math.pow(m.lng - centerLng, 2));
                        if (dist < 0.01) {
                            evasionLat = (m.lat - centerLat) * 0.12;
                            evasionLng = (m.lng - centerLng) * 0.12;
                        }
                    }
                }
                const jitterLat = (Math.random() - 0.5) * 0.0030 * jitterMultiplier; // More visible movement
                const jitterLng = (Math.random() - 0.5) * 0.0030 * jitterMultiplier;

                let nextLat = m.lat + driftLat + jitterLat + evasionLat;
                let nextLng = m.lng + driftLng + jitterLng + evasionLng;

                // Path Snapping: Snap to nearest tunnel
                const [snappedLat, snappedLng] = projectToNearestTunnel(nextLat, nextLng);

                // Hazard Detection (using most recent zones via scale calculation)
                let inDanger = false;
                let dangerZone: string | null = null;

                const scale = 1 + Math.sin(Date.now() / 2000) * 0.05;
                for (const zone of DANGER_ZONES) {
                    const centerLat = zone.polygon.reduce((sum, p) => sum + p[0], 0) / zone.polygon.length;
                    const centerLng = zone.polygon.reduce((sum, p) => sum + p[1], 0) / zone.polygon.length;
                    const scaledPolygon = zone.polygon.map(([lat, lng]) => [
                        centerLat + (lat - centerLat) * scale,
                        centerLng + (lng - centerLng) * scale
                    ] as [number, number]);

                    if (pointInPolygon(snappedLat, snappedLng, scaledPolygon)) {
                        inDanger = true;
                        dangerZone = zone.name;
                        break;
                    }
                }

                const wasDanger = prevDangerRef.current[m.id] || false;
                if (inDanger && !wasDanger) {
                    newAlerts.push({
                        id: `${m.id}-${Date.now()}`,
                        minerName: m.name, workerId: m.workerId,
                        zoneName: dangerZone!,
                        riskLevel: DANGER_ZONES.find(z => z.name === dangerZone)?.riskLevel || "high",
                        time: new Date().toISOString(),
                        lat: snappedLat, lng: snappedLng,
                    });
                }
                prevDangerRef.current[m.id] = inDanger;
                return {
                    ...m, lat: snappedLat, lng: snappedLng,
                    inDanger, dangerZone,
                    state: newState, ticksInDanger: newTicksInDanger, ticksActive: newTicksActive
                };
            });

            if (newAlerts.length > 0) {
                setTimeout(() => {
                    setSimAlerts(a => [...newAlerts, ...a].slice(0, 50));
                }, 0);
            }

            return updated;
        });
    }, []);

    // Start/Stop intervals at Dashboard level
    useEffect(() => {
        if (simRunning) {
            const ms = Math.max(400, 2000 / simSpeed); // Min 400ms between ticks
            intervalRef.current = setInterval(tick, ms);
            timerRef.current = setInterval(() => setSimElapsed(e => e + 1), 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [simRunning, simSpeed, tick]);

    const handleSimReset = () => {
        setSimRunning(false);

        // Randomize positions within the mining area [20.9345–20.9661, 85.1595–85.281]
        const LAT_MIN = 20.9360, LAT_MAX = 20.9640;
        const LNG_MIN = 85.1900, LNG_MAX = 85.2280;
        const randomizedMiners = createInitialMiners().map(m => {
            const lat = LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN);
            const lng = LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN);
            return { ...m, lat, lng, baseLat: lat, baseLng: lng };
        });

        setSimMiners(randomizedMiners);
        setSimZones(DANGER_ZONES);
        setSimAlerts([]);
        setSimElapsed(0);
        prevDangerRef.current = {};
    };


    // Count of alerts for the nav badge
    const alertCount = simAlerts.length;


    return (
        <div className="h-screen bg-surface-deep flex overflow-hidden">
            {/* ─── Sidebar ─── */}
            <aside className={`fixed lg:relative z-40 h-screen transition-all duration-300 ${sidebarOpen ? "w-56" : "w-0 lg:w-16"} bg-surface border-r border-accent/10 flex flex-col overflow-hidden`}>
                <div className="h-14 flex items-center px-4 border-b border-accent/10 gap-2.5 flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(239,136,82,0.1)]">
                        <HardHat className="w-4 h-4 text-surface-deep" />
                    </div>
                    {sidebarOpen && <span className="text-[14px] font-black tracking-tight whitespace-nowrap uppercase italic">undergrid<span className="text-accent">.ai</span></span>}
                </div>

                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => setActive(item.id)}
                            className={`sidebar-item w-full ${active === item.id ? "active" : ""}`}>
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {sidebarOpen && (
                                <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
                            )}
                            {sidebarOpen && item.id === "alerts" && alertCount > 0 && (
                                <span className="bg-accent/20 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase min-w-[20px] text-center shadow-[0_0_10px_rgba(239,136,82,0.05)]">
                                    {alertCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-2 border-t border-white/[0.04]">
                    <Link to="/" className="sidebar-item w-full">
                        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="text-[13px]">Home</span>}
                    </Link>
                </div>
            </aside>

            {/* ─── Main ─── */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <header className="sticky top-0 z-30 h-14 bg-surface-deep/90 backdrop-blur-md border-b border-accent/10 flex items-center px-5 gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-text-secondary hover:text-accent transition-colors">
                        {sidebarOpen ? <X className="w-4 h-4 lg:hidden" /> : <Menu className="w-4 h-4" />}
                        <span className="hidden lg:block">{sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}</span>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-[15px] font-black uppercase tracking-tight italic">{navItems.find(n => n.id === active)?.label}</h1>
                        <p className="text-[11px] text-accent-muted font-bold uppercase tracking-widest">Underground Command Hub</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-accent font-bold uppercase tracking-widest">Online</span>
                    </div>
                </header>

                <div className="p-5 max-w-[1400px] mx-auto relative">
                    {/* Keep DronePatrol explicitly mounted in background to preserve simulation loop */}
                    <div
                        className="transition-opacity duration-300"
                        style={{
                            position: active === "drone" ? "relative" : "absolute",
                            opacity: active === "drone" ? 1 : 0,
                            pointerEvents: active === "drone" ? "auto" : "none",
                            zIndex: active === "drone" ? 10 : -10,
                            top: 20, left: 20, right: 20
                        }}
                    >
                        <DroneSection />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className={active === "drone" ? "hidden" : "block"}>
                            {active === "overview" && (
                                <OverviewSection
                                    simMiners={simMiners} setSimMiners={setSimMiners}
                                    simRunning={simRunning} setSimRunning={setSimRunning}
                                    simSpeed={simSpeed} setSimSpeed={setSimSpeed}
                                    simElapsed={simElapsed} setSimElapsed={setSimElapsed}
                                    simAlerts={simAlerts} setSimAlerts={setSimAlerts}
                                    simZones={simZones}
                                    simCommand={simCommand}
                                    setSimCommand={setSimCommand}
                                    onSimReset={handleSimReset}
                                />
                            )}
                            {active === "zones" && <ZonesSection />}
                            {active === "miners" && <MinersSection />}
                            {active === "alerts" && <AlertsSection simAlerts={simAlerts} clearSimAlerts={() => setSimAlerts([])} />}
                            {active === "report" && <ReportSection simMiners={simMiners} simAlerts={simAlerts} simZones={simZones} />}
                            {active === "incidents" && <IncidentsSection />}
                            {active === "seismic" && <SeismicMonitor />}
                            {active === "ventilation" && <VentilationControl />}
                            {active === "ai-terminal" && <AITerminalSection simMiners={simMiners} simAlerts={simAlerts} simZones={simZones} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* ─── Global AI Popup (accessible from any page) ─── */}
            <GlobalAIPopup />
        </div>
    );
}

/* ─── Overview (now includes LiveSim) ─── */
function OverviewSection({
    simMiners, setSimMiners, simRunning, setSimRunning,
    simSpeed, setSimSpeed, simElapsed, setSimElapsed,
    simAlerts, setSimAlerts, simZones, simCommand, setSimCommand, onSimReset,
}: {
    simMiners: SimMiner[];
    setSimMiners: React.Dispatch<React.SetStateAction<SimMiner[]>>;
    simRunning: boolean;
    setSimRunning: (v: boolean) => void;
    simSpeed: number;
    setSimSpeed: (v: number) => void;
    simElapsed: number;
    setSimElapsed: React.Dispatch<React.SetStateAction<number>>;
    simAlerts: SimAlertEntry[];
    setSimAlerts: React.Dispatch<React.SetStateAction<SimAlertEntry[]>>;
    simZones: any[]; // Or more specific type
    simCommand: { type: 'none' | 'recall' | 'evacuate'; zoneId?: string };
    setSimCommand: (cmd: { type: 'none' | 'recall' | 'evacuate'; zoneId?: string }) => void;
    onSimReset: () => void;
}) {
    const systemStatuses = [
        { label: "InSAR Satellite", icon: Satellite, status: "Receiving", color: "#EF8852" },
        { label: "AI Engine", icon: Brain, status: "Active", color: "#AB7E75" },
        { label: "RFID Grid", icon: Wifi, status: "Online", color: "#82463C" },
        { label: "Workers", icon: Users, status: `${simMiners.length} Tracked`, color: "#EF8852" },
    ];

    return (
        <div className="space-y-5">
            {/* System Status */}
            <div>
                <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">System Status</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {systemStatuses.map((sys) => (
                        <div key={sys.label} className="relative group overflow-hidden rounded-xl p-3 bg-surface-elevated/20 border border-accent/5 shadow-2xl transition-all hover:bg-accent/5 hover:border-accent/20 text-left">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full opacity-30 pointer-events-none" style={{ background: `linear-gradient(to bottom left, ${sys.color}20, transparent)` }} />

                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shadow-inner"
                                    style={{ background: `${sys.color}15`, border: `1px solid ${sys.color}30` }}>
                                    <sys.icon className="w-4 h-4" style={{ color: sys.color }} />
                                </div>
                                <div>
                                    <div className="text-[12px] font-bold text-white/80 tracking-wide">{sys.label}</div>
                                    <div className="text-[10px] font-mono mt-0.5" style={{ color: sys.color }}>{sys.status}</div>
                                </div>
                            </div>

                            <div className="relative z-10 h-1 rounded-full bg-black/50 overflow-hidden border border-white/5">
                                <div className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_10px_currentColor]" style={{ width: "85%", background: sys.color, color: sys.color }} />
                                <div className="absolute inset-y-0 left-0 rounded-full animate-pulse opacity-50 bg-white" style={{ width: "85%" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Commands */}
            <div>
                <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Interactive Controls</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                        onClick={() => setSimCommand({ type: 'recall' })}
                        className={`relative group overflow-hidden rounded-xl p-3 text-left transition-all duration-300 ${simCommand.type === 'recall'
                            ? 'bg-accent/10 border border-accent/40 shadow-[0_0_20px_rgba(239,136,82,0.05)]'
                            : 'bg-surface-elevated/40 border border-accent/5 hover:bg-accent/5 hover:border-accent/20'
                            }`}
                    >
                        {simCommand.type === 'recall' && (
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                        )}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${simCommand.type === 'recall' ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent/70 group-hover:text-accent group-hover:bg-accent/20'
                                }`}>
                                <RotateCcw className={`w-5 h-5 ${simCommand.type === 'recall' ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-text-primary tracking-wide">Recall All</div>
                                <div className="text-[10px] text-accent/60 font-mono mt-0.5">Return to Base</div>
                            </div>
                        </div>
                    </button>

                    {simZones.map(zone => {
                        const isEvacuating = simCommand.type === 'evacuate' && simCommand.zoneId === zone.id;
                        return (
                            <button
                                key={zone.id}
                                onClick={() => setSimCommand({ type: 'evacuate', zoneId: zone.id })}
                                className={`relative group overflow-hidden rounded-xl p-3 text-left transition-all duration-300 ${isEvacuating
                                    ? 'bg-red-500/10 border border-red-400/40 shadow-[0_0_20px_rgba(248,113,113,0.15)]'
                                    : 'bg-black/40 border border-white/5 hover:bg-red-500/5 hover:border-red-400/20'
                                    }`}
                            >
                                {isEvacuating && (
                                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-50" />
                                )}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isEvacuating ? 'bg-accent/20 text-accent' : 'bg-white/5 text-accent/70 group-hover:text-accent group-hover:bg-accent/10'}`}>
                                        <AlertTriangle className={`w-5 h-5 ${isEvacuating ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-bold text-white/90 tracking-wide">Evacuate</div>
                                        <div className="text-[10px] text-accent/60 font-black uppercase tracking-widest mt-0.5 truncate max-w-[100px]">{zone.name.split('—')[1] || zone.name}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {simCommand.type !== 'none' && (
                        <button
                            onClick={() => setSimCommand({ type: 'none' })}
                            className="relative group overflow-hidden rounded-xl p-3 text-left transition-all duration-300 bg-surface-elevated/40 border border-accent/10 hover:bg-surface-elevated/60 hover:border-accent/20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/40 text-white/40 group-hover:text-white/80 transition-colors">
                                    <X className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[13px] font-bold text-white/90 tracking-wide">Release</div>
                                    <div className="text-[10px] text-white/40 font-mono mt-0.5">Clear Command</div>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Evacuation Routing */}
            <EvacuationRoutes />

            {/* Live Miner Simulation */}
            <LiveMinerSimulation
                miners={simMiners} setMiners={setSimMiners}
                dangerZones={simZones}
                running={simRunning} setRunning={setSimRunning}
                speed={simSpeed} setSpeed={setSimSpeed}
                elapsed={simElapsed} setElapsed={setSimElapsed}
                simAlerts={simAlerts} setSimAlerts={setSimAlerts}
                onReset={onSimReset}
            />
        </div>
    );
}

function ZonesSection() {
    return (
        <div className="space-y-5">
            <HeatmapViewer />
            <GeoZoneChart />
        </div>
    );
}

function MinersSection() {
    return <LiveMinersData />;
}

/* ─── Alerts (receives sim alerts + DB alerts) ─── */
function AlertsSection({ simAlerts, clearSimAlerts }: { simAlerts: SimAlertEntry[]; clearSimAlerts: () => void }) {
    return (
        <div className="space-y-5">
            {/* Sim Alerts Section */}
            {simAlerts.length > 0 && (
                <div className="glass-card p-5 danger-pulse" style={{ borderColor: "rgba(255,51,51,0.25)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-tight italic flex items-center gap-2 text-accent">
                            <AlertTriangle className="w-4 h-4" /> Simulation Danger Alerts
                            <span className="bg-accent/10 text-accent text-[11px] px-2 py-0.5 rounded-full font-bold"> {simAlerts.length} </span>
                        </h3>
                        <button onClick={clearSimAlerts} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Clear</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        <AnimatePresence>
                            {simAlerts.map(a => (
                                <motion.div key={a.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-400/5 border border-red-400/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-accent" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-white/80">{a.minerName} ({a.workerId})</div>
                                            <div className="text-[11px] text-white/40">entered {a.zoneName}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                                            style={{
                                                background: a.riskLevel === "critical" ? "rgba(255,51,51,0.15)" : a.riskLevel === "high" ? "rgba(255,102,0,0.15)" : "rgba(255,170,0,0.15)",
                                                color: a.riskLevel === "critical" ? "#ff3333" : a.riskLevel === "high" ? "#ff6600" : "#ffaa00"
                                            }}>
                                            {a.riskLevel}
                                        </div>
                                        <div className="text-[10px] text-white/20 font-mono mt-1">
                                            {new Date(a.time).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Backend-based Risk Alerts */}
            <RiskAlertsPanel />
        </div>
    );
}

/* ─── Report (receives sim data for context) ─── */
function ReportSection({ simMiners, simAlerts, simZones }: { simMiners: SimMiner[]; simAlerts: SimAlertEntry[]; simZones: any[] }) {
    return <SafetyReport simMiners={simMiners} simAlerts={simAlerts} simZones={simZones} />;
}

function IncidentsSection() {
    return <IncidentTimeline />;
}

function DroneSection() {
    return <DronePatrol />;
}

function AITerminalSection({ simMiners, simAlerts, simZones }: { simMiners?: SimMiner[]; simAlerts?: SimAlertEntry[]; simZones?: any[] }) {
    return <AITerminal simMiners={simMiners} simAlerts={simAlerts} simZones={simZones} />;
}
