import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, RefreshCw, Users, Activity, HardHat } from "lucide-react";

interface Worker {
    _id: string; name: string; workerId: string; helmetId: string; role: string;
    currentLocation: { type: string; coordinates: [number, number]; timeStamp: string };
    lastUpdated: string; __v: number;
}

const roleColors: Record<string, string> = {
    miner: "#EF8852", engineer: "#AB7E75", "safety officer": "#EF8852AA",
    electrician: "#AB7E75CC", welder: "#EF885299", plumber: "#AB7E75AA",
    operator: "#EF8852BB", technician: "#AB7E75BB",
};

export default function MinersMap({ workers, isOnline, lastUpdate, onRefresh }: {
    workers: Worker[]; isOnline?: boolean; lastUpdate?: string; onRefresh?: () => void;
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapObj, setMapObj] = useState<any>(null);
    const [loaded, setLoaded] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        if (!mapRef.current || mapObj) return;
        const L = (window as any).L;
        if (!L) return;

        let cLat = 20.9503, cLng = 85.2213;
        if (workers.length) {
            cLat = workers.reduce((s, w) => s + w.currentLocation.coordinates[1], 0) / workers.length;
            cLng = workers.reduce((s, w) => s + w.currentLocation.coordinates[0], 0) / workers.length;
        }

        const map = L.map(mapRef.current, { center: [cLat, cLng], zoom: 14 });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Mining area
        L.polygon([
            [20.9345, 85.1595], [20.9345, 85.281], [20.9661, 85.281], [20.9661, 85.1595], [20.9345, 85.1595]
        ], { color: "#EF8852", weight: 1.5, opacity: 0.5, fillColor: "#EF8852", fillOpacity: 0.03, dashArray: "6,4" })
            .addTo(map).bindPopup("<b style='color:#EF8852'>Talcher Mining Area</b>");

        setMapObj(map); setLoaded(true);
        return () => { map.remove(); };
    }, []);

    useEffect(() => {
        if (!mapObj || !loaded) return;
        const L = (window as any).L;
        if (!L) return;

        mapObj.eachLayer((l: any) => { if (l instanceof L.Marker) mapObj.removeLayer(l); });

        const groups = new Map<string, Worker[]>();
        workers.forEach(w => {
            const [lng, lat] = w.currentLocation.coordinates;
            const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(w);
        });

        groups.forEach((wks, key) => {
            const [lat, lng] = key.split(",").map(Number);
            const primary = wks[0];
            const c = roleColors[primary.role.toLowerCase()] || "#6b7280";
            const n = wks.length;

            const html = `<div style="width:${n > 1 ? 42 : 32}px;height:${n > 1 ? 42 : 32}px;background:${c};border-radius:50%;border:2px solid #000;box-shadow:0 0 12px ${c}60;display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:${n > 1 ? 13 : 12}px;position:relative">${n > 1 ? n : "⛑️"}${n > 1 ? `<div style="position:absolute;top:-4px;right:-4px;background:#ff3333;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;border:2px solid #000">${n}</div>` : ""}</div>`;

            const popup = `<div style="min-width:200px;background:#1a1a1a;color:#fff;padding:2px">${wks.map(w => {
                const rc = roleColors[w.role.toLowerCase()] || "#888";
                return `<div style="padding:8px;border-left:3px solid ${rc};margin-bottom:4px;background:#22222280;border-radius:4px"><b>${w.name}</b><br/><span style="color:#888;font-size:11px">ID: ${w.workerId} · ${w.role}</span></div>`;
            }).join("")}</div>`;

            L.marker([lat, lng], {
                icon: L.divIcon({ html, className: "", iconSize: [n > 1 ? 42 : 32, n > 1 ? 42 : 32], iconAnchor: [n > 1 ? 21 : 16, n > 1 ? 21 : 16] })
            }).addTo(mapObj).bindPopup(popup, { maxWidth: 300, className: "" });
        });

        if (workers.length && groups.size) {
            const markers = Array.from(groups.keys()).map(k => { const [la, lo] = k.split(",").map(Number); return L.marker([la, lo]); });
            mapObj.fitBounds(new L.featureGroup(markers).getBounds().pad(0.1));
        }
    }, [workers, mapObj, loaded]);

    const toggle = () => { setFullscreen(!fullscreen); setTimeout(() => mapObj?.invalidateSize(), 150); };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent shadow-glow" /> Live Map
                </h3>
                <div className="flex gap-2">
                    {onRefresh && <button onClick={onRefresh} className="btn-ghost text-xs px-3 py-1.5"><RefreshCw className="w-3.5 h-3.5 mr-1 inline" />Refresh</button>}
                    <button onClick={toggle} className="btn-ghost text-xs px-3 py-1.5">{fullscreen ? <Minimize2 className="w-3.5 h-3.5 inline mr-1" /> : <Maximize2 className="w-3.5 h-3.5 inline mr-1" />}{fullscreen ? "Exit" : "Fullscreen"}</button>
                </div>
            </div>

            <div className={`glass-card overflow-hidden transition-all ${fullscreen ? "fixed inset-4 z-50" : "relative"}`}>
                <div ref={mapRef} className={`w-full ${fullscreen ? "h-full" : "h-[500px]"}`} style={{ minHeight: 400 }} />
                {!loaded && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin shadow-glow" /></div>}
                {fullscreen && <button onClick={toggle} className="absolute top-4 right-4 z-20 btn-ghost text-xs px-3 py-1.5"><Minimize2 className="w-3.5 h-3.5 inline mr-1" />Close</button>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { icon: Users, label: "On Map", val: workers.length, c: "var(--accent-primary)" },
                    { icon: Activity, label: "Active", val: workers.filter(w => (Date.now() - Date.parse(w.lastUpdated)) < 300000).length, c: "var(--accent-primary)" },
                    { icon: HardHat, label: "Roles", val: new Set(workers.map(w => w.role)).size, c: "var(--accent-secondary)" },
                    { icon: MapPin, label: "Updated", val: lastUpdate || "—", c: "var(--accent-primary)" },
                ].map(s => (
                    <div key={s.label} className="stat-card py-3 px-4 shadow-sm border border-accent/10">
                        <div className="flex items-center gap-2 mb-1"><s.icon className="w-4 h-4" style={{ color: s.c }} /><span className="text-[10px] text-accent-muted font-black uppercase tracking-widest">{s.label}</span></div>
                        <div className="text-xl font-black italic tracking-tight" style={{ color: s.c }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="glass-card p-4">
                <h4 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Role Legend</h4>
                <div className="flex flex-wrap gap-3">
                    {Array.from(new Set(workers.map(w => w.role))).map(r => (
                        <span key={r} className="flex items-center gap-2 text-xs">
                            <span className="w-3 h-3 rounded-full border border-black" style={{ background: roleColors[r.toLowerCase()] || "#888" }} />
                            {r} <span className="text-white/30">({workers.filter(w => w.role === r).length})</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
