import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Crosshair, Play, Pause, RotateCcw, Maximize2, Minimize2,
    Radio, Zap, Battery, Gauge, Wind, AlertTriangle,
    Activity, Signal, ChevronRight, X
} from "lucide-react";
import { useSimContext } from "@/context/SimContext";

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */
interface DroneState {
    id: string;
    name: string;
    color: string;
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
    battery: number;
    route: [number, number][];
    progress: number;       // 0-1 along route
    status: "patrolling" | "emergency" | "idle" | "returning";
    targetMiner: string | null;
    gasReading: number;     // ppm
    structuralScore: number; // 0-100
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */
const DRONE_CONFIGS = [
    {
        id: "alpha", name: "Alpha", color: "#a855f7",
        route: [
            [20.9380, 85.2050], [20.9420, 85.2100], [20.9460, 85.2150],
            [20.9520, 85.2200], [20.9460, 85.2150], [20.9420, 85.2100], [20.9380, 85.2050],
        ] as [number, number][],
    },
    {
        id: "beta", name: "Beta", color: "#06b6d4",
        route: [
            [20.9420, 85.2050], [20.9420, 85.2120], [20.9420, 85.2190],
            [20.9420, 85.2230], [20.9420, 85.2190], [20.9420, 85.2120], [20.9420, 85.2050],
        ] as [number, number][],
    },
    {
        id: "gamma", name: "Gamma", color: "#f59e0b",
        route: [
            [20.9350, 85.2120], [20.9420, 85.2120], [20.9470, 85.2120],
            [20.9550, 85.2120], [20.9470, 85.2120], [20.9420, 85.2120], [20.9350, 85.2120],
        ] as [number, number][],
    },
];

const LOOP_DURATION = 20000; // 20s per loop
const SCAN_RADIUS = 200; // meters

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function interpolateRoute(route: [number, number][], t: number): [number, number] {
    if (!route || route.length === 0) return [0, 0];
    if (route.length === 1) return route[0];
    // Protect against negative or NaN t
    let validT = Number(t) || 0;
    if (validT < 0) validT = 0;
    if (validT > 1) validT = 1;

    const totalSegments = route.length - 1;
    let segment = Math.floor(validT * totalSegments);
    if (segment < 0) segment = 0;
    if (segment >= totalSegments) segment = totalSegments - 1;

    const localT = (validT * totalSegments) - segment;
    const p1 = route[segment] || route[0];
    const p2 = route[segment + 1] || route[route.length - 1];

    return [
        p1[0] + (p2[0] - p1[0]) * localT,
        p1[1] + (p2[1] - p1[1]) * localT
    ];
}

function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

function createInitialDrones(): DroneState[] {
    return DRONE_CONFIGS.map(cfg => ({
        ...cfg,
        lat: cfg.route[0][0],
        lng: cfg.route[0][1],
        altitude: 45 + Math.random() * 15,
        speed: 0,
        battery: 95 + Math.random() * 5,
        progress: 0,
        status: "idle" as const,
        targetMiner: null,
        gasReading: Math.random() * 5,
        structuralScore: 85 + Math.random() * 15,
    }));
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */
export default function DronePatrol() {
    const { simMiners, simZones, setSimDrones } = useSimContext();

    const [drones, setDrones] = useState<DroneState[]>(createInitialDrones);
    const [playing, setPlaying] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [selectedDrone, setSelectedDrone] = useState<string | null>("alpha");

    const mapRef = useRef<HTMLDivElement>(null);
    const mapObjRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const droneMarkersRef = useRef<Map<string, any>>(new Map());
    const scanCirclesRef = useRef<Map<string, any>>(new Map());
    const trailsRef = useRef<Map<string, any>>(new Map());
    const routeLinesRef = useRef<any[]>([]);
    const animFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const trailPointsRef = useRef<Map<string, [number, number][]>>(new Map());
    const simMinersRef = useRef(simMiners);

    // Keep ref synced without restarting loops
    useEffect(() => {
        simMinersRef.current = simMiners;
    }, [simMiners]);

    /* ─── Sync drone positions to global context for LiveMinerSimulation ─── */
    useEffect(() => {
        setSimDrones(drones.map(d => ({
            id: d.id,
            name: d.name,
            color: d.color,
            lat: d.lat,
            lng: d.lng,
            status: d.status,
        })));
    }, [drones]);

    /* ─── Init Map ─── */
    useEffect(() => {
        if (!mapRef.current || mapObjRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        const map = L.map(mapRef.current, {
            center: [20.9450, 85.2120],
            zoom: 14,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Mining area polygon
        L.polygon([
            [20.9345, 85.1595], [20.9345, 85.281], [20.9661, 85.281], [20.9661, 85.1595]
        ], { color: "#EF8852", weight: 1.5, opacity: 0.3, fillColor: "#EF8852", fillOpacity: 0.02, dashArray: "6,4" })
            .addTo(map).bindPopup("<b style='color:#EF8852'>Mining Area Boundary</b>");

        // Danger zones from context
        const zones = simZones.length > 0 ? simZones : [
            { id: "zone-a", name: "Zone A", color: "#ff3333", polygon: [[20.9435, 85.2125], [20.9435, 85.2155], [20.9455, 85.2155], [20.9455, 85.2125]] },
            { id: "zone-b", name: "Zone B", color: "#ff6600", polygon: [[20.9405, 85.2085], [20.9405, 85.2110], [20.9425, 85.2110], [20.9425, 85.2085]] },
            { id: "zone-c", name: "Zone C", color: "#ffaa00", polygon: [[20.9465, 85.2090], [20.9465, 85.2120], [20.9485, 85.2120], [20.9485, 85.2090]] },
        ];
        zones.forEach((zone: any) => {
            L.polygon(zone.polygon, {
                color: zone.color, weight: 2, opacity: 0.5,
                fillColor: zone.color, fillOpacity: 0.1, dashArray: "4,4",
            }).addTo(map);
        });

        // Patrol route lines
        DRONE_CONFIGS.forEach(cfg => {
            const line = L.polyline(cfg.route, {
                color: cfg.color, weight: 1.5, opacity: 0.2, dashArray: "6,6",
            }).addTo(map);
            routeLinesRef.current.push(line);
        });

        // Drone markers, scan circles, trails
        DRONE_CONFIGS.forEach(cfg => {
            const icon = L.divIcon({
                html: createDroneIconHtml(cfg.color, false),
                className: "",
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            const marker = L.marker(cfg.route[0], { icon, zIndexOffset: 2000 }).addTo(map);
            marker.on('click', () => setSelectedDrone(cfg.id));
            droneMarkersRef.current.set(cfg.id, marker);

            const circle = L.circle(cfg.route[0], {
                radius: SCAN_RADIUS,
                color: cfg.color,
                weight: 1,
                opacity: 0.3,
                fillColor: cfg.color,
                fillOpacity: 0.06,
            }).addTo(map);
            scanCirclesRef.current.set(cfg.id, circle);

            const trail = L.polyline([], {
                color: cfg.color, weight: 3, opacity: 0.5,
            }).addTo(map);
            trailsRef.current.set(cfg.id, trail);
            trailPointsRef.current.set(cfg.id, []);
        });

        mapObjRef.current = map;
        setMapReady(true);

        return () => {
            map.remove();
            mapObjRef.current = null;
            droneMarkersRef.current.clear();
            scanCirclesRef.current.clear();
            trailsRef.current.clear();
            routeLinesRef.current = [];
            trailPointsRef.current.clear();
            setMapReady(false);
        };
    }, []);

    /* ─── Emergency Override ─── */
    useEffect(() => {
        if (!playing) return;
        const endangeredMiners = simMiners.filter(m => m.inDanger);

        if (endangeredMiners.length === 0) {
            // Return all emergency drones to patrol
            setDrones(prev => prev.map(d =>
                d.status === "emergency" ? { ...d, status: "returning", targetMiner: null } : d
            ));
            return;
        }

        setDrones(prev => {
            const updated = [...prev];
            for (const miner of endangeredMiners) {
                // Skip if a drone is already tasked to this miner
                if (updated.some(d => d.targetMiner === miner.id)) continue;

                // Find closest available drone
                let closestIdx = -1;
                let closestDist = Infinity;
                updated.forEach((d, i) => {
                    if (d.status === "emergency") return; // already busy
                    const dist = distanceBetween(d.lat, d.lng, miner.lat, miner.lng);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                });

                if (closestIdx >= 0) {
                    updated[closestIdx] = {
                        ...updated[closestIdx],
                        status: "emergency",
                        targetMiner: miner.id,
                    };
                }
            }
            return updated;
        });
    }, [simMiners, playing]);

    /* ─── Animation Loop ─── */
    useEffect(() => {
        if (!playing || !mapReady) return;

        lastFrameTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const delta = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            setDrones(prev => prev.map(drone => {
                let newLat = drone.lat;
                let newLng = drone.lng;
                let newProgress = drone.progress;
                let newSpeed = drone.speed;
                let newStatus = drone.status;
                let newTarget = drone.targetMiner;
                let newBattery = Math.max(0, drone.battery - 0.0005);
                let newGas = Math.max(0, drone.gasReading + (Math.random() - 0.5) * 0.3);
                let newStruct = Math.min(100, Math.max(60, drone.structuralScore + (Math.random() - 0.5) * 0.5));
                let newAltitude = 45 + Math.sin(now / 3000) * 5;

                if (drone.status === "emergency" && drone.targetMiner) {
                    // Fly toward the endangered miner using ref
                    const miner = simMinersRef.current.find(m => m.id === drone.targetMiner);
                    if (miner && miner.inDanger) {
                        const dx = miner.lng - drone.lng;
                        const dy = miner.lat - drone.lat;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0.0003) {
                            const moveStep = 0.00005; // Normal speed
                            newLat = drone.lat + (dy / dist) * moveStep;
                            newLng = drone.lng + (dx / dist) * moveStep;
                            newSpeed = 3; // Keep normal speed
                        } else {
                            newSpeed = 0; // hovering over miner
                        }
                    } else {
                        newStatus = "returning";
                        newTarget = null;
                    }
                } else if (drone.status === "returning") {
                    // Fly back to exact point where we paused our patrol progress
                    const target = interpolateRoute(drone.route, drone.progress);
                    const dx = target[1] - drone.lng;
                    const dy = target[0] - drone.lat;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0.0005) {
                        const moveStep = 0.00005; // Normal speed
                        newLat = drone.lat + (dy / dist) * moveStep;
                        newLng = drone.lng + (dx / dist) * moveStep;
                        newSpeed = 3;
                    } else {
                        newStatus = "patrolling";
                        newSpeed = 3;
                    }
                } else if (drone.status === "patrolling") {
                    newProgress = (drone.progress + (delta / LOOP_DURATION)) % 1;
                    const pos = interpolateRoute(drone.route, newProgress);
                    newLat = pos[0];
                    newLng = pos[1];
                    newSpeed = 3 + Math.sin(newProgress * Math.PI * 2) * 1.5;
                }

                return {
                    ...drone,
                    lat: newLat, lng: newLng,
                    progress: newProgress,
                    speed: newSpeed,
                    status: newStatus,
                    targetMiner: newTarget,
                    battery: newBattery,
                    altitude: newAltitude,
                    gasReading: newGas,
                    structuralScore: newStruct,
                };
            }));

            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [playing, mapReady]); // Fixed stutter by removing simMiners dependency

    /* ─── Update Leaflet markers ─── */
    useEffect(() => {
        if (!mapReady) return;
        const L = (window as any).L;
        if (!L) return;

        drones.forEach(drone => {
            const marker = droneMarkersRef.current.get(drone.id);
            const circle = scanCirclesRef.current.get(drone.id);
            const trail = trailsRef.current.get(drone.id);

            if (marker) {
                marker.setLatLng([drone.lat, drone.lng]);
                marker.setIcon(L.divIcon({
                    html: createDroneIconHtml(drone.color, drone.status === "emergency"),
                    className: "",
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                }));
            }
            if (circle) {
                circle.setLatLng([drone.lat, drone.lng]);
                circle.setStyle({
                    color: drone.status === "emergency" ? "#ff3333" : drone.color,
                    fillColor: drone.status === "emergency" ? "#ff3333" : drone.color,
                    fillOpacity: drone.status === "emergency" ? 0.12 : 0.06,
                });
            }
            if (trail) {
                const pts = trailPointsRef.current.get(drone.id) || [];
                pts.push([drone.lat, drone.lng]);
                if (pts.length > 80) pts.shift();
                trailPointsRef.current.set(drone.id, pts);
                trail.setLatLngs([...pts]);
                trail.setStyle({
                    color: drone.status === "emergency" ? "#ff3333" : drone.color,
                });
            }
        });
    }, [drones, mapReady]);

    /* ─── Helpers ─── */
    const handleReset = () => {
        setPlaying(false);
        setDrones(createInitialDrones());
        trailPointsRef.current.forEach(pts => pts.length = 0);
        trailsRef.current.forEach(trail => trail?.setLatLngs([]));
    };

    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
        setTimeout(() => mapObjRef.current?.invalidateSize(), 150);
    };

    const selected = drones.find(d => d.id === selectedDrone) || null;

    return (
        <div className="space-y-4">
            {/* ─── Header ─── */}
            <div className="glass-card-accent p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center">
                            <Crosshair className="w-5 h-5 text-surface-deep" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                                Drone Fleet Command
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${playing ? "bg-accent/10 text-accent font-bold" : "bg-white/5 text-white/40"}`}>
                                    {playing ? `● ${drones.filter(d => d.status !== "idle").length} Active` : "○ Standby"}
                                </span>
                            </h2>
                            <p className="text-accent-muted font-bold uppercase tracking-widest text-[10px] mt-0.5">Multi-drone autonomous patrol & emergency response</p>
                        </div>
                    </div>

                    {/* ─── Control Bar ─── */}
                    <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-inner">
                        <button onClick={() => {
                            setPlaying(!playing);
                            if (!playing) {
                                setDrones(prev => prev.map(d => d.status === "idle" ? { ...d, status: "patrolling" } : d));
                            }
                        }}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${playing
                                ? "bg-accent/20 text-accent border border-accent/40 shadow-[0_0_15px_rgba(239,136,82,0.2)]"
                                : "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 shadow-[0_0_15px_rgba(239,136,82,0.1)]"
                                }`}>
                            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {playing ? "PAUSE" : "DEPLOY"}
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button onClick={handleReset}
                            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 focus:outline-none">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>

                        <button onClick={toggleFullscreen}
                            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 focus:outline-none">
                            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            {fullscreen ? "Exit" : "Expand"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Fleet Status Cards ─── */}
            <div className="grid grid-cols-3 gap-3">
                {drones.map(drone => {
                    const isSelected = selectedDrone === drone.id;
                    const isEmergency = drone.status === "emergency";
                    return (
                        <button key={drone.id} onClick={() => setSelectedDrone(drone.id)}
                            className={`relative group rounded-xl p-3 text-left transition-all duration-300 overflow-hidden ${isSelected
                                ? `bg-black/60 border-2 shadow-[0_0_20px_${drone.color}30]`
                                : "bg-black/40 border border-white/5 hover:bg-white/[0.03]"
                                } ${isEmergency ? "border-red-400/50" : ""}`}
                            style={{ borderColor: isSelected ? drone.color + "60" : undefined }}
                        >
                            {isEmergency && (
                                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse" />
                            )}
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${isEmergency ? "animate-pulse" : ""}`}
                                    style={{ background: `${isEmergency ? "#ff3333" : drone.color}20` }}>
                                    🛸
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-bold text-white/90">{drone.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${isEmergency
                                            ? "bg-red-400/20 text-red-400 animate-pulse"
                                            : drone.status === "patrolling"
                                                ? "bg-emerald-400/15 text-emerald-400"
                                                : drone.status === "returning"
                                                    ? "bg-amber-400/15 text-amber-400"
                                                    : "bg-white/10 text-white/40"
                                            }`}>
                                            {isEmergency ? "⚠ EMERGENCY" : drone.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                                            <Battery className="w-3 h-3" /> {drone.battery.toFixed(0)}%
                                        </span>
                                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                                            <Gauge className="w-3 h-3" /> {drone.speed.toFixed(1)}m/s
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-white/60" : "text-white/20"}`} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ─── Map + Telemetry Panel ─── */}
            <div className={`grid grid-cols-1 ${selected ? "xl:grid-cols-3" : ""} gap-4`}>
                {/* Map */}
                <div className={`${selected ? "xl:col-span-2" : ""} glass-card overflow-hidden relative ${fullscreen ? "fixed inset-4 z-50" : ""}`}>
                    <div ref={mapRef} className={`w-full ${fullscreen ? "h-full" : "h-[500px]"}`} style={{ minHeight: 400 }} />

                    {fullscreen && (
                        <button onClick={toggleFullscreen} className="absolute top-4 right-4 z-20 btn-ghost text-xs px-3 py-1.5">
                            <Minimize2 className="w-3.5 h-3.5 inline mr-1" /> Close
                        </button>
                    )}

                    {/* Emergency overlay */}
                    <AnimatePresence>
                        {drones.some(d => d.status === "emergency") && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/40 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                                    EMERGENCY OVERRIDE — {drones.filter(d => d.status === "emergency").length} drone(s) dispatched
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 z-[1000] p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Fleet</div>
                        {drones.map(d => (
                            <div key={d.id} className="flex items-center gap-2 text-xs mb-1 last:mb-0 cursor-pointer hover:text-white/80"
                                onClick={() => setSelectedDrone(d.id)}>
                                <div className={`w-3 h-3 rounded-full ${d.status === "emergency" ? "animate-pulse" : ""}`}
                                    style={{ background: d.status === "emergency" ? "#ff3333" : d.color }} />
                                <span className="text-white/60">{d.name}</span>
                                <span className="text-[10px] ml-auto" style={{ color: d.status === "emergency" ? "#ff3333" : d.color }}>
                                    {d.status === "emergency" ? "⚠" : d.status === "patrolling" ? "●" : "○"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Telemetry Panel ─── */}
                {selected && !fullscreen && (
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-5 flex flex-col gap-4"
                        style={{ borderColor: selected.status === "emergency" ? "rgba(255,51,51,0.3)" : `${selected.color}30` }}
                    >
                        {/* Telemetry Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${selected.status === "emergency" ? "animate-pulse" : ""}`}
                                    style={{ background: `${selected.status === "emergency" ? "#ff3333" : selected.color}20` }}>
                                    🛸
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{selected.name}</h3>
                                    <span className={`text-[10px] font-mono font-bold ${selected.status === "emergency" ? "text-red-400" : "text-white/40"}`}>
                                        {selected.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDrone(null)} className="text-white/30 hover:text-white/60 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: Activity, label: "Altitude", value: `${selected.altitude.toFixed(1)}m`, color: "#a855f7" },
                                { icon: Gauge, label: "Speed", value: `${selected.speed.toFixed(1)} m/s`, color: "#06b6d4" },
                                { icon: Battery, label: "Battery", value: `${selected.battery.toFixed(0)}%`, color: selected.battery > 20 ? "#00ff88" : "#ff3333" },
                                { icon: Signal, label: "Signal", value: "Strong", color: "#00ff88" },
                            ].map(t => (
                                <div key={t.label} className="p-3 rounded-lg bg-black/40 border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <t.icon className="w-3 h-3" style={{ color: t.color }} />
                                        <span className="text-[10px] text-white/30 uppercase">{t.label}</span>
                                    </div>
                                    <div className="text-sm font-bold font-mono" style={{ color: t.color }}>{t.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Sensor Readings */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Sensor Readings</h4>

                            {/* Gas Level */}
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] text-white/50 flex items-center gap-1.5">
                                        <Wind className="w-3 h-3 text-cyan-400" /> Gas Level
                                    </span>
                                    <span className={`text-[11px] font-mono font-bold ${selected.gasReading > 15 ? "text-red-400" : selected.gasReading > 8 ? "text-amber-400" : "text-emerald-400"}`}>
                                        {selected.gasReading.toFixed(1)} ppm
                                    </span>
                                </div>
                                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (selected.gasReading / 25) * 100)}%`,
                                            background: selected.gasReading > 15 ? "#ff3333" : selected.gasReading > 8 ? "#f59e0b" : "#00ff88",
                                        }} />
                                </div>
                            </div>

                            {/* Structural Score */}
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] text-white/50 flex items-center gap-1.5">
                                        <Radio className="w-3 h-3 text-purple-400" /> Structural Integrity
                                    </span>
                                    <span className={`text-[11px] font-mono font-bold ${selected.structuralScore > 80 ? "text-emerald-400" : selected.structuralScore > 60 ? "text-amber-400" : "text-red-400"}`}>
                                        {selected.structuralScore.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${selected.structuralScore}%`,
                                            background: selected.structuralScore > 80 ? "#00ff88" : selected.structuralScore > 60 ? "#f59e0b" : "#ff3333",
                                        }} />
                                </div>
                            </div>
                        </div>

                        {/* Coordinates */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                            <div className="text-[10px] text-white/30 uppercase mb-1.5">Position</div>
                            <div className="text-[11px] font-mono text-white/60">
                                {selected.lat.toFixed(6)}°N, {selected.lng.toFixed(6)}°E
                            </div>
                        </div>

                        {/* Emergency Target */}
                        {selected.status === "emergency" && selected.targetMiner && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-400/30"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                                    <span className="text-[11px] font-bold text-red-400 uppercase">Emergency Override</span>
                                </div>
                                <div className="text-[11px] text-white/60">
                                    Responding to: <span className="text-white font-semibold">
                                        {simMiners.find(m => m.id === selected.targetMiner)?.name || "Unknown"}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ─── Fleet Progress Bars ─── */}
            <div className="grid grid-cols-3 gap-3">
                {drones.map(drone => (
                    <div key={drone.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/30 w-12">{drone.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: drone.status === "emergency" ? "100%" : `${drone.progress * 100}%`,
                                    background: drone.status === "emergency" ? "#ff3333" : drone.color,
                                    opacity: drone.status === "emergency" ? 1 : 0.6,
                                }} />
                        </div>
                        <span className="text-[10px] font-mono text-white/25 w-8 text-right">
                            {drone.status === "emergency" ? "⚠" : `${Math.round(drone.progress * 100)}%`}
                        </span>
                    </div>
                ))}
            </div>

            {/* ─── Footer Info ─── */}
            <div className="flex items-center gap-4 text-[11px] text-white/25">
                <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-accent" /> {drones.length} drones</span>
                <span>Loop: {LOOP_DURATION / 1000}s</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-accent" /> Scan radius: {SCAN_RADIUS}m</span>
                <span className={playing ? "text-accent font-bold" : "text-white/25"}>
                    {playing ? "● Fleet Active" : "○ Standby"}
                </span>
            </div>
        </div>
    );
}

/* ─── Drone icon HTML generator ─── */
function createDroneIconHtml(color: string, isEmergency: boolean): string {
    const glowColor = isEmergency ? "rgba(255,51,51,0.6)" : `${color}60`;
    const borderColor = isEmergency ? "#ff3333" : color;
    const pulseStyle = isEmergency ? "animation:danger-marker-pulse 0.8s ease-in-out infinite;" : "";

    return `<div style="position:relative;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${glowColor};opacity:0.3;animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;top:-2px;left:-2px"></div>
  <div style="width:36px;height:36px;background:${isEmergency ? '#ff333330' : color + '20'};border-radius:50%;border:2px solid ${borderColor};box-shadow:0 0 18px ${glowColor};display:flex;align-items:center;justify-content:center;font-size:16px;${pulseStyle}position:relative;z-index:1">🛸</div>
</div>`;
}
