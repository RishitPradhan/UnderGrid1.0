import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, RotateCcw, AlertTriangle, Shield, Volume2, VolumeX,
    Users, Activity, Zap, Clock, Radio
} from "lucide-react";
import axios from "axios";
import { useSimContext } from "@/context/SimContext";
import BiometricsPanel from "@/components/BiometricsPanel";
import HazardHeatmap from "@/components/HazardHeatmap";
import HelmetHUD from "@/components/HelmetHUD";

const SERVER = "http://localhost:3000";

/* ─── Types ─── */
export interface SimMiner {
    id: string;
    name: string;
    workerId: string;
    role: string;
    lat: number;
    lng: number;
    baseLat: number;
    baseLng: number;
    color: string;
    inDanger: boolean;
    dangerZone: string | null;
    state: "normal" | "fatigued" | "panicked";
    ticksInDanger: number;
    ticksActive: number;
}

export interface DangerZone {
    id: string;
    name: string;
    riskLevel: "high" | "medium" | "critical";
    color: string;
    polygon: [number, number][]; // [lat, lng][]
}

export interface SimAlertEntry {
    id: string;
    minerName: string;
    workerId: string;
    zoneName: string;
    riskLevel: string;
    time: string;
    lat: number;
    lng: number;
}

/* ─── Constants (exported for reuse) ─── */
const ROLE_COLORS: Record<string, string> = {
    miner: "#EF8852", engineer: "#AB7E75", "safety officer": "#82463C",
    electrician: "#f3a57b", welder: "#d97706", plumber: "#a78bfa",
    operator: "#8b5cf6", technician: "#ec4899",
};

/*
 * ══════════════════════════════════════════════════════════════════
 *   TALCHER COALFIELDS — REALISTIC UNDERGROUND MINE LAYOUT
 *   Location: Talcher, Angul District, Odisha, India
 *   Type: Underground Board & Pillar Coal Mine
 * ══════════════════════════════════════════════════════════════════
 *
 *   Layout Overview (North is Up):
 *
 *   [EXIT-1: Main Shaft]          [EXIT-4: Ventilation Shaft]
 *         │                              │
 *    ─────┼──────── Main Dip Haulage ────┼───────────
 *         │        (North-South)         │
 *    ─────┼──── 1st Level Cross-Cut ─────┼───────────
 *         │    ╔══ Panel 1A ══╗          │
 *    ─────┼──── 2nd Level Cross-Cut ─────┼───────────
 *         │    ║  DANGER: CH₄ ║          │
 *    ─────┼──── 3rd Level Cross-Cut ─────┼───────────
 *         │    ╚══════════════╝   [DANGER: Roof Fall]
 *    ─────┼──── 4th Level Cross-Cut ─────┼───────────
 *         │                    [DANGER: Water]
 *   [EXIT-2: Belt Conveyor]    [EXIT-3: Emergency Shaft]
 *
 * ══════════════════════════════════════════════════════════════════
 */

/** Center of the Talcher underground mine */
export const MINE_CENTER: [number, number] = [20.9440, 85.2120];

/** Mining lease boundary polygon (expanded) */
export const MINE_BOUNDARY: [number, number][] = [
    [20.9300, 85.1940], [20.9300, 85.2300],
    [20.9600, 85.2320], [20.9620, 85.2160],
    [20.9600, 85.1940],
];

/** Exit points / Pit heads — positioned at network edges */
export const EXIT_POINTS: { id: string; name: string; coords: [number, number] }[] = [
    { id: "exit-1", name: "Main Shaft (Pit Head #1)", coords: [20.9580, 85.2000] },
    { id: "exit-2", name: "Belt Conveyor Incline", coords: [20.9320, 85.2000] },
    { id: "exit-3", name: "Emergency Escape Shaft (South)", coords: [20.9320, 85.2240] },
    { id: "exit-4", name: "Ventilation Shaft #2 (NE)", coords: [20.9580, 85.2240] },
];

/** Miners positioned ON tunnel paths */
export const INITIAL_MINERS: Omit<SimMiner, "baseLat" | "baseLng" | "inDanger" | "dangerZone" | "state" | "ticksInDanger" | "ticksActive">[] = [
    // On Main Dip West, near 3rd Level
    { id: "m1", name: "Ravi Kumar", workerId: "W001", role: "Miner", lat: 20.9460, lng: 85.2000, color: ROLE_COLORS.miner },
    // On 3rd Level Cross-Cut, near Panel 2B
    { id: "m2", name: "Nirupon Pal", workerId: "W002", role: "Miner", lat: 20.9460, lng: 85.2080, color: ROLE_COLORS.miner },
    // On 2nd Level Cross-Cut
    { id: "m3", name: "Suresh Behera", workerId: "W003", role: "Engineer", lat: 20.9500, lng: 85.2060, color: ROLE_COLORS.engineer },
    // On Pillar Road East, patrolling
    { id: "m4", name: "Priya Sharma", workerId: "W004", role: "Safety Officer", lat: 20.9540, lng: 85.2180, color: ROLE_COLORS["safety officer"] },
    // On 4th Level Cross-Cut, near roof fall zone
    { id: "m5", name: "Amit Singh", workerId: "W005", role: "Electrician", lat: 20.9420, lng: 85.2160, color: ROLE_COLORS.electrician },
    // On Main Dip East, southern section
    { id: "m6", name: "Rajesh Patel", workerId: "W006", role: "Operator", lat: 20.9360, lng: 85.2200, color: ROLE_COLORS.operator },
    // On Panel 2B Heading (deep in mine)
    { id: "m7", name: "Sunita Devi", workerId: "W007", role: "Welder", lat: 20.9440, lng: 85.2070, color: ROLE_COLORS.welder },
    // On 5th Level Cross-Cut, near water ingress
    { id: "m8", name: "Vikram Singh", workerId: "W008", role: "Technician", lat: 20.9380, lng: 85.2120, color: ROLE_COLORS.technician },
    // On Main Dip East, near exit-4
    { id: "m9", name: "Anita Kumari", workerId: "W009", role: "Plumber", lat: 20.9520, lng: 85.2240, color: ROLE_COLORS.plumber },
];

/** Danger zones overlapping tunnel segments */
export const DANGER_ZONES: DangerZone[] = [
    {
        id: "zone-a",
        name: "Zone A — Gas Leak",
        riskLevel: "critical",
        color: "#ff3333",
        // Overlaps 3rd Level Cross-Cut and Panel 2B Heading
        polygon: [
            [20.9448, 85.2040], [20.9448, 85.2100],
            [20.9472, 85.2100], [20.9472, 85.2040],
        ],
    },
    {
        id: "zone-b",
        name: "Zone B — Unstable Roof",
        riskLevel: "high",
        color: "#ff6600",
        // Overlaps 4th Level Cross-Cut near eastern side
        polygon: [
            [20.9410, 85.2140], [20.9410, 85.2210],
            [20.9436, 85.2210], [20.9436, 85.2140],
        ],
    },
    {
        id: "zone-c",
        name: "Zone C — Flooding Risk",
        riskLevel: "medium",
        color: "#ffaa00",
        // Overlaps 5th Level Cross-Cut and Old Workings Spur
        polygon: [
            [20.9360, 85.2050], [20.9360, 85.2120],
            [20.9396, 85.2120], [20.9396, 85.2050],
        ],
    },
];

/* ─── Tunnel Network — Dense Board & Pillar Layout (2x spread) ─── */
export const TUNNEL_PATHS: [number, number][][] = [
    // ══════ MAIN HAULAGE ROADS (N-S Arteries) ══════

    // Main Dip West — Exit-1 (N) to Exit-2 (S)
    [[20.9580, 85.2000], [20.9540, 85.2000], [20.9500, 85.2000], [20.9460, 85.2000], [20.9420, 85.2000], [20.9380, 85.2000], [20.9340, 85.2000], [20.9320, 85.2000]],

    // Main Dip East — Exit-4 (N) to Exit-3 (S)
    [[20.9580, 85.2240], [20.9540, 85.2240], [20.9500, 85.2240], [20.9460, 85.2240], [20.9420, 85.2240], [20.9380, 85.2240], [20.9340, 85.2240], [20.9320, 85.2240]],

    // Central Haulage — N-S through mine center
    [[20.9580, 85.2120], [20.9540, 85.2120], [20.9500, 85.2120], [20.9460, 85.2120], [20.9420, 85.2120], [20.9380, 85.2120], [20.9340, 85.2120], [20.9320, 85.2120]],

    // ══════ CROSS-CUTS (E-W connections) ══════

    // 1st Level Cross-Cut (Northernmost)
    [[20.9540, 85.2000], [20.9540, 85.2060], [20.9540, 85.2120], [20.9540, 85.2180], [20.9540, 85.2240]],

    // 2nd Level Cross-Cut
    [[20.9500, 85.2000], [20.9500, 85.2060], [20.9500, 85.2120], [20.9500, 85.2180], [20.9500, 85.2240]],

    // 3rd Level Cross-Cut
    [[20.9460, 85.2000], [20.9460, 85.2060], [20.9460, 85.2120], [20.9460, 85.2180], [20.9460, 85.2240]],

    // 4th Level Cross-Cut
    [[20.9420, 85.2000], [20.9420, 85.2060], [20.9420, 85.2120], [20.9420, 85.2180], [20.9420, 85.2240]],

    // 5th Level Cross-Cut (Southernmost)
    [[20.9380, 85.2000], [20.9380, 85.2060], [20.9380, 85.2120], [20.9380, 85.2180], [20.9380, 85.2240]],

    // ══════ INTERMEDIATE N-S PILLARS ══════

    // Pillar Road West (between Main Dip West and Central)
    [[20.9540, 85.2060], [20.9500, 85.2060], [20.9460, 85.2060], [20.9420, 85.2060], [20.9380, 85.2060]],

    // Pillar Road East (between Central and Main Dip East)
    [[20.9540, 85.2180], [20.9500, 85.2180], [20.9460, 85.2180], [20.9420, 85.2180], [20.9380, 85.2180]],

    // ══════ DEVELOPMENT HEADINGS / PANELS ══════

    // Panel 1A Heading — branches south off 2nd Level
    [[20.9500, 85.2060], [20.9484, 85.2036], [20.9470, 85.2020]],

    // Panel 2B Heading — branches into CH₄ zone
    [[20.9460, 85.2060], [20.9450, 85.2080], [20.9440, 85.2070]],

    // Panel 3C Heading — near old workings
    [[20.9420, 85.2060], [20.9404, 85.2036], [20.9390, 85.2020]],

    // Panel 4D Heading — branches east
    [[20.9460, 85.2180], [20.9450, 85.2210], [20.9440, 85.2230]],

    // ══════ VENTILATION DRIFTS ══════

    // Return Airway (West)
    [[20.9560, 85.2030], [20.9520, 85.2030], [20.9480, 85.2030], [20.9440, 85.2030], [20.9400, 85.2030], [20.9360, 85.2030]],

    // Return Airway (East)
    [[20.9560, 85.2210], [20.9520, 85.2210], [20.9480, 85.2210], [20.9440, 85.2210], [20.9400, 85.2210], [20.9360, 85.2210]],

    // ══════ ACCESS SPURS ══════

    // Vent spur west
    [[20.9540, 85.2000], [20.9560, 85.2030]],

    // Vent spur east
    [[20.9540, 85.2240], [20.9560, 85.2210]],

    // Old Workings Spur (southern dead-end)
    [[20.9380, 85.2060], [20.9370, 85.2080], [20.9360, 85.2100]],
];

/* ─── Point-in-Polygon Ray Casting ─── */
export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}



/* ─── Project Point to segment ─── */
export function projectToNearestTunnel(lat: number, lng: number): [number, number] {
    let minSourceDist = Infinity;
    let closestPoint: [number, number] = [lat, lng];

    for (const segment of TUNNEL_PATHS) {
        for (let i = 0; i < segment.length - 1; i++) {
            const p1 = segment[i];
            const p2 = segment[i + 1];

            const dx = p2[1] - p1[1];
            const dy = p2[0] - p1[0];
            if (dx === 0 && dy === 0) continue;

            const t = ((lng - p1[1]) * dx + (lat - p1[0]) * dy) / (dx * dx + dy * dy);
            const clampedT = Math.max(0, Math.min(1, t));

            const projLat = p1[0] + clampedT * dy;
            const projLng = p1[1] + clampedT * dx;

            const dist = Math.pow(lat - projLat, 2) + Math.pow(lng - projLng, 2);
            if (dist < minSourceDist) {
                minSourceDist = dist;
                closestPoint = [projLat, projLng];
            }
        }
    }
    return closestPoint;
}

/* ─── Create initial miners helper ─── */
export function createInitialMiners(): SimMiner[] {
    return INITIAL_MINERS.map(m => ({
        ...m, baseLat: m.lat, baseLng: m.lng,
        inDanger: false, dangerZone: null,
        state: "normal", ticksInDanger: 0, ticksActive: 0
    }));
}

/* ─── Props ─── */
interface LiveMinerSimulationProps {
    miners: SimMiner[];
    setMiners: React.Dispatch<React.SetStateAction<SimMiner[]>>;
    dangerZones: DangerZone[]; // Add this
    running: boolean;
    setRunning: (v: boolean) => void;
    speed: number;
    setSpeed: (v: number) => void;
    elapsed: number;
    setElapsed: React.Dispatch<React.SetStateAction<number>>;
    simAlerts: SimAlertEntry[];
    setSimAlerts: React.Dispatch<React.SetStateAction<SimAlertEntry[]>>;
    onReset: () => void;
}

/* ─── Component ─── */
export default function LiveMinerSimulation({
    miners, setMiners, dangerZones, running, setRunning, speed, setSpeed,
    elapsed, setElapsed, simAlerts, setSimAlerts, onReset
}: LiveMinerSimulationProps) {
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [toasts, setToasts] = useState<SimAlertEntry[]>([]);
    const [selectedMiner, setSelectedMiner] = useState<SimMiner | null>(null);
    const [hudMiner, setHudMiner] = useState<SimMiner | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapObjRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const droneMarkersOnSimRef = useRef<Map<string, any>>(new Map());
    const seismicRipplesRef = useRef<any[]>([]);
    const evacPolylinesRef = useRef<any[]>([]);
    const zonesRef = useRef<any[]>([]);
    const [mapReady, setMapReady] = useState(false);
    const prevAlertCountRef = useRef(simAlerts.length);
    const { simDrones, simSeismicEvents, simEvacRoutes } = useSimContext();

    /* ─── Voice ─── */
    const speak = useCallback((text: string) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1; u.pitch = 0.85; u.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    }, [voiceEnabled]);

    /* ─── Init Map ─── */
    useEffect(() => {
        if (!mapRef.current || mapObjRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        const map = L.map(mapRef.current, {
            center: MINE_CENTER,
            zoom: 15,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Mining lease boundary
        L.polygon(MINE_BOUNDARY, {
            color: "#3b82f6", weight: 1.5, opacity: 0.4,
            fillColor: "#3b82f6", fillOpacity: 0.03, dashArray: "10,6"
        }).addTo(map).bindPopup("<b style='color:#3b82f6'>Talcher Coalfields — Mining Lease Boundary</b><br/><span style='color:#888;font-size:11px'>Angul District, Odisha</span>");

        // Exit point markers (green pulsing beacons)
        EXIT_POINTS.forEach(exit => {
            const exitHtml = `<div style="display:flex;flex-direction:column;align-items:center">
  <div style="width:22px;height:22px;background:#10b981;border-radius:50%;border:3px solid #065f46;box-shadow:0 0 16px rgba(16,185,129,0.6);animation:danger-marker-pulse 1.5s ease-in-out infinite;display:flex;align-items:center;justify-content:center;font-size:11px">🚪</div>
  <div style="margin-top:2px;background:rgba(0,0,0,0.85);border:1px solid rgba(16,185,129,0.4);border-radius:5px;padding:2px 6px;white-space:nowrap;text-align:center">
    <div style="font-size:9px;font-weight:700;color:#10b981">${exit.name}</div>
    <div style="font-size:7px;color:rgba(255,255,255,0.4);font-family:monospace">EXIT POINT</div>
  </div>
</div>`;
            L.marker(exit.coords, {
                icon: L.divIcon({ html: exitHtml, className: "", iconSize: [140, 55], iconAnchor: [70, 11] }),
                zIndexOffset: 800,
            }).addTo(map);
        });

        // Danger zones
        dangerZones.forEach(zone => {
            const poly = L.polygon(zone.polygon, {
                color: zone.color, weight: 2, opacity: 0.7,
                fillColor: zone.color, fillOpacity: 0.15, dashArray: "4,4",
            }).addTo(map);
            poly.bindPopup(`<div style="min-width:160px;background:#1a1a1a;color:#fff;padding:4px"><b style="color:${zone.color}">${zone.name}</b><br/><span style="color:#888;font-size:11px">Risk: ${zone.riskLevel.toUpperCase()}</span></div>`);
            zonesRef.current.push(poly);

            const center = zone.polygon.reduce(
                (acc, p) => [acc[0] + p[0] / zone.polygon.length, acc[1] + p[1] / zone.polygon.length], [0, 0]
            );
            L.marker(center, {
                icon: L.divIcon({
                    html: `<div style="color:${zone.color};font-size:10px;font-weight:700;text-shadow:0 0 6px #000;white-space:nowrap;text-align:center">${zone.name}</div>`,
                    className: "", iconSize: [200, 20], iconAnchor: [100, 10],
                }),
            }).addTo(map);
        });

        // Tunnel network rendering
        TUNNEL_PATHS.forEach((path, idx) => {
            // Outer glow (wider, semi-transparent)
            L.polyline(path, {
                color: idx < 3 ? "#555" : "#333", // Main haulage roads are brighter
                weight: idx < 3 ? 10 : 6,
                opacity: idx < 3 ? 0.5 : 0.3,
                lineCap: "round", lineJoin: "round"
            }).addTo(map);
            // Inner line (thinner, dashed for texture)
            L.polyline(path, {
                color: idx < 3 ? "#888" : "#555",
                weight: idx < 3 ? 4 : 2,
                opacity: 0.7,
                lineCap: "round", lineJoin: "round",
                dashArray: idx < 3 ? undefined : "5,8" // Cross-cuts are dashed
            }).addTo(map);
        });


        mapObjRef.current = map;
        setMapReady(true);

        return () => {
            map.remove();
            mapObjRef.current = null;
            markersRef.current.clear();
            droneMarkersOnSimRef.current.clear();
            zonesRef.current = [];
            setMapReady(false);
        };
    }, []);

    /* ─── Update markers when miners change ─── */
    useEffect(() => {
        if (!mapReady) return;
        const L = (window as any).L;
        const map = mapObjRef.current;
        if (!L || !map) return;

        miners.forEach(m => {
            const existing = markersRef.current.get(m.id);
            const bg = m.inDanger ? "#ff3333" : m.color;
            const borderStyle = m.inDanger ? "3px solid #ff0000" : "2px solid #111";
            const glowStyle = m.inDanger
                ? "box-shadow:0 0 16px 4px rgba(255,51,51,0.7);"
                : `box-shadow:0 0 10px ${m.color}50;`;
            const pulseStyle = m.inDanger ? "animation:danger-marker-pulse 0.8s ease-in-out infinite;" : "";
            const statusColor = m.inDanger ? "#ff3333" : "#00ff88";
            const shortZone = m.dangerZone ? m.dangerZone.split(" ")[0] + " " + m.dangerZone.split(" ")[1] : "";
            const statusText = m.inDanger ? "IN " + shortZone : "Safe";

            const stateColor = m.state === 'panicked' ? '#ff3333' : m.state === 'fatigued' ? '#ffa500' : statusColor;
            const html = `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer">
  <div style="width:26px;height:26px;background:${bg};border-radius:50%;border:${borderStyle};${glowStyle}${pulseStyle}display:flex;align-items:center;justify-content:center;font-size:12px">&#9937;&#65039;</div>
  <div style="margin-top:2px;background:rgba(0,0,0,0.82);border:1px solid ${m.inDanger ? 'rgba(255,51,51,0.5)' : 'rgba(255,255,255,0.15)'};border-radius:5px;padding:2px 5px;text-align:center;min-width:80px">
    <div style="font-size:9px;font-weight:700;color:#fff">${m.name}</div>
    <div style="font-size:7px;font-weight:600;color:${stateColor}">${m.state.toUpperCase()} | ${statusText}</div>
    <div style="font-size:7px;color:rgba(255,255,255,0.45);font-family:monospace">${m.lat.toFixed(4)}N ${m.lng.toFixed(4)}E</div>
  </div>
</div>`;

            const icon = L.divIcon({ html, className: "miner-marker-icon", iconSize: [100, 65], iconAnchor: [50, 13] });
            const popup = `<div style="min-width:200px;background:#1a1a1a;color:#fff;padding:10px;border-radius:8px">
  <div style="font-size:14px;font-weight:700;margin-bottom:2px">${m.name}</div>
  <div style="color:#888;font-size:11px;margin-bottom:8px">ID: ${m.workerId} | ${m.role}</div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
    <div style="background:rgba(255,255,255,0.03);padding:6px;border-radius:6px">
        <div style="font-size:9px;color:#666;text-transform:uppercase">State</div>
        <div style="font-size:11px;color:${stateColor};font-weight:700">${m.state.toUpperCase()}</div>
    </div>
    <div style="background:rgba(255,255,255,0.03);padding:6px;border-radius:6px">
        <div style="font-size:9px;color:#666;text-transform:uppercase">Shift</div>
        <div style="font-size:11px;color:#aaa;font-weight:700">${(m.ticksActive / 60).toFixed(1)}h</div>
    </div>
  </div>

  <div style="color:${m.inDanger ? '#ff3333' : '#00ff88'};font-size:12px;font-weight:600;margin-bottom:6px">
    ${m.inDanger ? '&#9888; IN DANGER: ' + m.dangerZone : '&#9989; WORKER SAFE'}
  </div>
  <div style="color:#666;font-size:11px;font-family:monospace;padding:4px 6px;background:rgba(255,255,255,0.05);border-radius:4px">
    Lat: ${m.lat.toFixed(6)}N<br/>Lng: ${m.lng.toFixed(6)}E
  </div>
</div>`;

            if (existing) {
                existing.setLatLng([m.lat, m.lng]);
                existing.setIcon(icon);
                existing.setPopupContent(popup);
            } else {
                const marker = L.marker([m.lat, m.lng], { icon, zIndexOffset: 1000 })
                    .addTo(map).bindPopup(popup, { maxWidth: 280 });

                // Click: open biometrics panel
                marker.on("click", () => {
                    const currentMiner = miners.find(mi => mi.id === m.id) || m;
                    setSelectedMiner(currentMiner);
                });

                // Double-click: open helmet HUD
                marker.on("dblclick", (e: any) => {
                    e.originalEvent?.preventDefault?.();
                    const currentMiner = miners.find(mi => mi.id === m.id) || m;
                    setHudMiner(currentMiner);
                });

                markersRef.current.set(m.id, marker);
            }
        });
    }, [miners, mapReady]);

    /* ─── Render drone markers from global context ─── */
    useEffect(() => {
        if (!mapReady) return;
        const L = (window as any).L;
        const map = mapObjRef.current;
        if (!L || !map) return;

        simDrones.forEach(drone => {
            const existing = droneMarkersOnSimRef.current.get(drone.id);
            const isEmergency = drone.status === "emergency";
            const glowColor = isEmergency ? "rgba(255,51,51,0.6)" : `${drone.color}80`;
            const html = `<div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer">
  <div style="position:relative;width:32px;height:32px;display:flex;justify-content:center;align-items:center">
    <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${glowColor};opacity:0.35;animation:danger-marker-pulse 1.5s ease-in-out infinite;top:-4px;left:-4px"></div>
    <div style="width:32px;height:32px;background:${drone.color}25;border-radius:50%;border:2px solid ${isEmergency ? '#ff3333' : drone.color};box-shadow:0 0 14px ${glowColor};display:flex;align-items:center;justify-content:center;font-size:14px;position:relative;z-index:1">🛸</div>
  </div>
  <div style="margin-top:2px;background:rgba(0,0,0,0.82);border:1px solid ${drone.color}50;border-radius:4px;padding:1px 5px;white-space:nowrap;text-align:center">
    <div style="font-size:8px;font-weight:700;color:${drone.color}">🛸 ${drone.name}</div>
    <div style="font-size:7px;color:rgba(255,255,255,0.4)">${isEmergency ? '⚠ EMERGENCY' : drone.status.toUpperCase()}</div>
  </div>
</div>`;
            const icon = L.divIcon({ html, className: "miner-marker-icon", iconSize: [100, 58], iconAnchor: [50, 16] });
            if (existing) {
                existing.setLatLng([drone.lat, drone.lng]);
                existing.setIcon(icon);
            } else {
                const marker = L.marker([drone.lat, drone.lng], { icon, zIndexOffset: 1500 })
                    .addTo(map)
                    .bindPopup(`<div style="min-width:160px;background:#1a1a1a;color:#fff;padding:8px;border-radius:8px"><b style="color:${drone.color}">🛸 Drone ${drone.name}</b><br/><span style="color:#888;font-size:11px">Status: ${drone.status.toUpperCase()}</span></div>`);
                droneMarkersOnSimRef.current.set(drone.id, marker);
            }
        });

        // Remove drones that no longer exist in context
        droneMarkersOnSimRef.current.forEach((marker, id) => {
            if (!simDrones.find(d => d.id === id)) {
                map.removeLayer(marker);
                droneMarkersOnSimRef.current.delete(id);
            }
        });
    }, [simDrones, mapReady]);

    /* ─── Seismic ripple markers on map ─── */
    useEffect(() => {
        if (!mapReady) return;
        const L = (window as any).L;
        const map = mapObjRef.current;
        if (!L || !map) return;

        // Remove old ripples
        seismicRipplesRef.current.forEach(layer => map.removeLayer(layer));
        seismicRipplesRef.current = [];

        // Show only the 3 most recent events
        simSeismicEvents.slice(0, 3).forEach((ev, idx) => {
            const opacity = 0.4 - idx * 0.12;
            const circle = L.circle([ev.epicenter.lat, ev.epicenter.lng], {
                radius: 80 + ev.magnitude * 50,
                color: ev.magnitude > 2.5 ? "#ff3333" : "#f59e0b",
                fillColor: ev.magnitude > 2.5 ? "#ff3333" : "#f59e0b",
                fillOpacity: Math.max(0.05, opacity * 0.3),
                weight: 1.5,
                opacity: Math.max(0.1, opacity),
                className: "seismic-ripple",
            }).addTo(map);
            circle.bindPopup(`<b>Seismic Event</b><br/>Magnitude: ${ev.magnitude}<br/>Type: ${ev.type}<br/>Depth: ${ev.depth}m`);
            seismicRipplesRef.current.push(circle);
        });
    }, [simSeismicEvents, mapReady]);

    /* ─── Evacuation route polylines on map ─── */
    useEffect(() => {
        if (!mapReady) return;
        const L = (window as any).L;
        const map = mapObjRef.current;
        if (!L || !map) return;

        // Remove old routes
        evacPolylinesRef.current.forEach(layer => map.removeLayer(layer));
        evacPolylinesRef.current = [];

        simEvacRoutes.forEach(route => {
            if (route.path.length < 2) return;
            const line = L.polyline(route.path, {
                color: "#00ff88",
                weight: 3,
                opacity: 0.7,
                dashArray: "8, 12",
                className: "evac-route-line",
            }).addTo(map);
            line.bindPopup(`<b>Evac Route</b><br/>${route.minerName}`);
            evacPolylinesRef.current.push(line);
        });
    }, [simEvacRoutes, mapReady]);

    /* ─── Watch for new alerts to show toasts + voice (only when component is mounted) ─── */
    useEffect(() => {
        if (simAlerts.length > prevAlertCountRef.current) {
            const newCount = simAlerts.length - prevAlertCountRef.current;
            const newAlerts = simAlerts.slice(0, newCount);
            setToasts(t => [...newAlerts, ...t].slice(0, 3));
            newAlerts.forEach(alert => {
                const zone = dangerZones.find(z => z.name === alert.zoneName);
                speak(`Warning! ${alert.minerName} has entered ${alert.zoneName}. Risk level: ${zone?.riskLevel || alert.riskLevel}.`);
            });
            setTimeout(() => {
                setToasts(t => t.filter(toast => !newAlerts.find(a => a.id === toast.id)));
            }, 4000);
        }
        prevAlertCountRef.current = simAlerts.length;
    }, [simAlerts, speak, dangerZones]);

    /* ─── Sync with Backend ─── */
    useEffect(() => {
        if (!running || miners.length === 0) return;

        const sync = async () => {
            try {
                await axios.post(`${SERVER}/worker/sync`, { miners });
            } catch (err) {
                console.error("Simulation sync failed:", err);
            }
        };

        const interval = setInterval(sync, 4000); // Sync every 4s to avoid overkill
        return () => clearInterval(interval);
    }, [running, miners]);

    /* ─── Reset handler ─── */
    const handleReset = () => {
        setToasts([]);
        onReset();
    };

    const dangerCount = miners.filter(m => m.inDanger).length;
    const safeCount = miners.length - dangerCount;
    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="glass-card-accent p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Live Miner Simulation
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${running ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)] border border-emerald-500/20" : "bg-white/5 text-white/40"}`}>
                                    {running ? "● Active" : "○ Paused"}
                                </span>
                            </h2>
                            <p className="text-white/40 text-xs">Real-time miner tracking with danger zone alerts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-inner">
                        <button onClick={() => setRunning(!running)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 transition-all duration-300 ${running
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.05)]"
                                }`}>
                            {running ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {running ? "PAUSE" : "START"}
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button onClick={handleReset}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 focus:outline-none">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>

                        <button onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center transition-all ${voiceEnabled
                                ? "text-white bg-white/10 border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                                : "text-text-secondary hover:bg-white/10 border border-transparent"
                                }`}>
                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 border border-accent/10" title="Simulation Speed">
                            <Zap className={`w-3.5 h-3.5 ${speed > 1 ? 'text-accent animate-pulse' : 'text-accent/60'}`} />
                            <div className="relative flex items-center group w-20">
                                <input type="range" min={0.5} max={3} step={0.5} value={speed}
                                    onChange={e => setSpeed(parseFloat(e.target.value))}
                                    className="absolute z-10 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-gradient-to-r from-accent to-accent-muted rounded-full transition-all duration-300 pointer-events-none"
                                        style={{ width: `${((speed - 0.5) / 2.5) * 100}%` }} />
                                </div>
                                <div className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-300"
                                    style={{ left: `calc(${((speed - 0.5) / 2.5) * 100}% - 6px)` }} />
                            </div>
                            <span className={`font-mono text-[10px] font-bold w-6 text-right ${speed > 1 ? 'text-accent' : 'text-accent/60'}`}>{speed}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { icon: Users, label: "Total Miners", value: miners.length, color: "#EF8852" },
                    { icon: Shield, label: "Safe", value: safeCount, color: "#AB7E75" },
                    { icon: AlertTriangle, label: "In Danger", value: dangerCount, color: "#82463C" },
                    { icon: Clock, label: "Elapsed", value: fmtTime(elapsed), color: "#ffaa00" },
                ].map(s => (
                    <div key={s.label} className={`stat-card ${s.label === "In Danger" && dangerCount > 0 ? "danger-pulse" : ""}`}>
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

            {/* Map + Alert Log */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Map */}
                <div className="xl:col-span-2 glass-card overflow-hidden relative">
                    <div ref={mapRef} className="w-full h-[500px]" style={{ minHeight: 400 }} />

                    {/* Biometrics Panel (click a miner marker) */}
                    <BiometricsPanel miner={selectedMiner} onClose={() => setSelectedMiner(null)} />

                    {/* Helmet AR HUD (double-click a miner) */}
                    <HelmetHUD miner={hudMiner} onClose={() => setHudMiner(null)} />

                    {/* Toast Alerts */}
                    <div className="absolute top-3 right-3 z-[1000] space-y-2 w-72">
                        <AnimatePresence>
                            {toasts.map(t => (
                                <motion.div key={t.id}
                                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                    transition={{ type: "spring", damping: 20 }}
                                    className="p-3 rounded-xl border backdrop-blur-md"
                                    style={{ background: "rgba(255,51,51,0.15)", borderColor: "rgba(255,51,51,0.4)" }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-accent" />
                                        <span className="text-xs font-black uppercase tracking-widest text-accent">Danger Alert</span>
                                    </div>
                                    <div className="text-sm text-white font-semibold">{t.minerName}</div>
                                    <div className="text-xs text-white/60">entered {t.zoneName}</div>
                                    <div className="text-[10px] text-white/30 font-mono mt-1">
                                        {t.lat.toFixed(5)}°N, {t.lng.toFixed(5)}°E
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Danger zone legend */}
                    <div className="absolute bottom-3 left-3 z-[1000] p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Danger Zones</div>
                        {dangerZones.map(z => (
                            <div key={z.id} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                                <div className="w-3 h-3 rounded-sm" style={{ background: z.color, opacity: 0.7 }} />
                                <span className="text-white/60">{z.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                                    style={{ background: `${z.color}20`, color: z.color }}>{z.riskLevel}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alert Log */}
                <div className="glass-card p-5 flex flex-col" style={{ borderColor: simAlerts.length > 0 ? "rgba(255,51,51,0.2)" : undefined }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-red-400">
                            <Activity className="w-4 h-4" /> Alert Log
                            {simAlerts.length > 0 && (
                                <span className="bg-accent/10 text-accent text-[11px] px-2 py-0.5 rounded-full font-bold"> {simAlerts.length} </span>
                            )}
                        </h3>
                        {simAlerts.length > 0 && (
                            <button onClick={() => setSimAlerts([])} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
                                Clear
                            </button>
                        )}
                    </div>

                    {simAlerts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <Shield className="w-10 h-10 text-accent-muted/30 mb-3" />
                            <p className="text-sm text-accent-muted/70 font-black uppercase tracking-widest">All Clear</p>
                            <p className="text-[11px] text-white/20 mt-1">{running ? "Monitoring for danger zone entries..." : "Start simulation to monitor miners"}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                            <AnimatePresence>
                                {simAlerts.map(a => (
                                    <motion.div key={a.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> {a.riskLevel.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-white/25 font-mono">
                                                {new Date(a.time).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-white/70 font-medium">{a.minerName} ({a.workerId})</div>
                                        <div className="text-[11px] text-white/40">{a.zoneName}</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Miner Grid */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">Miner Status</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
                    {miners.map(m => (
                        <div key={m.id}
                            className={`p-3 rounded-xl text-center transition-all ${m.inDanger
                                ? "bg-red-400/10 border border-red-400/30 danger-pulse"
                                : "bg-white/[0.02] border border-white/5"
                                }`}>
                            <div className="text-lg mb-1">{m.inDanger ? "🚨" : "⛑️"}</div>
                            <div className="text-[11px] font-medium text-white/70 truncate">{m.name.split(" ")[0]}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: m.inDanger ? "#ff3333" : "#00ff88" }}>
                                {m.inDanger ? "DANGER" : "Safe"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
