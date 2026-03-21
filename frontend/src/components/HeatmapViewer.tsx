import { useState, useEffect, useRef } from "react";
import {
    Globe, RefreshCw, Maximize2, Minimize2, ExternalLink,
    Satellite, Radio, Waves, AlertTriangle, Info
} from "lucide-react";

const GEOJSON_URL = "http://localhost:3000/data/synthetic_ps_points.geojson";

type Source = "satellite" | "drone" | "sensor";

export default function HeatmapViewer() {
    const [src, setSrc] = useState<Source>("satellite");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState("");
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObjRef = useRef<any>(null);
    const layersRef = useRef<any[]>([]);

    const fetchAndRender = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(GEOJSON_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            const L = (window as any).L;
            if (!L) {
                setError("Leaflet library not found");
                return;
            }

            if (!mapObjRef.current && mapRef.current) {
                mapObjRef.current = L.map(mapRef.current).setView([20.9503, 85.2213], 13);
                L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
                    maxZoom: 19,
                }).addTo(mapObjRef.current);
            }

            const map = mapObjRef.current;
            if (!map) return;

            // Clear existing markers
            layersRef.current.forEach(layer => map.removeLayer(layer));
            layersRef.current = [];

            // Add points as circle markers (limiting to 5000 for performance)
            data.features.slice(0, 5000).forEach((f: any) => {
                const [lng, lat] = f.geometry.coordinates;
                const risk = f.properties.risk;
                const velocity = Math.abs(f.properties.velocity_mm_yr);
                
                // Color based on risk/velocity (Unifying to theme palette)
                const color = risk === "High" ? "#EF8852" : velocity > 25 ? "#AB7E75" : "#EF885233";
                const opacity = risk === "High" ? 0.8 : 0.4;
                const radius = risk === "High" ? 4 : 2.5;

                const marker = L.circleMarker([lat, lng], {
                    radius: radius,
                    fillColor: color,
                    color: "transparent",
                    fillOpacity: opacity,
                });
                
                marker.addTo(map);
                layersRef.current.push(marker);
            });

            setLastRefresh(new Date().toLocaleTimeString());
        } catch (e: any) {
            setError(e.message || "Failed to load heatmap data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAndRender();
        }, 500); // Small delay to ensure Ref is attached
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const id = setInterval(fetchAndRender, 60000);
        return () => clearInterval(id);
    }, []);

    const toggle = () => {
        setFullscreen(!fullscreen);
        setTimeout(() => mapObjRef.current?.invalidateSize(), 150);
    };

    const sources: { id: Source; label: string; icon: any }[] = [
        { id: "satellite", label: "Satellite", icon: Satellite },
        { id: "drone", label: "Drone", icon: Globe },
        { id: "sensor", label: "Sensor", icon: Waves },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                        <Globe className="w-5 h-5 text-accent shadow-glow" /> Geological Heatmap (Odisha)
                    </h3>
                    <p className="text-xs text-white/30 mt-1">ML-powered land deformation analysis • Talcher Region</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Source Toggle */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                        {sources.map(s => (
                            <button key={s.id} onClick={() => setSrc(s.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${src === s.id ? "bg-accent/10 text-accent" : "text-white/40 hover:text-white"}`}>
                                <s.icon className="w-3.5 h-3.5" /> {s.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchAndRender} disabled={loading}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button onClick={toggle}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        {fullscreen ? "Exit" : "Expand"}
                    </button>
                </div>
            </div>

            {/* Map */}
            <div className={`glass-card overflow-hidden transition-all ${fullscreen ? "fixed inset-4 z-50" : "relative"}`}>
                <div ref={mapRef} className={`w-full bg-[#050505] ${fullscreen ? "h-full" : "h-[500px]"}`} style={{ minHeight: 400 }} />
                
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin shadow-glow" />
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">Processing geospatial data...</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center p-12 gap-4 bg-black/80 backdrop-blur-md">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                        <button onClick={fetchAndRender} className="btn-primary text-sm px-6 py-2">Retry Loading Local Data</button>
                    </div>
                )}

                {fullscreen && (
                    <button onClick={() => setFullscreen(false)}
                        className="absolute top-4 right-4 z-[1002] btn-ghost text-xs px-3 py-1.5 backdrop-blur-md">
                        <Minimize2 className="w-3.5 h-3.5 inline mr-1" /> Close
                    </button>
                )}

                {/* Legend Overlay */}
                <div className="absolute bottom-4 right-4 z-[1000] p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px]">
                    <div className="font-bold text-white/50 uppercase tracking-widest mb-2">Ground Deformation</div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#EF8852]" />
                        <span className="text-white/70">High Risk (&gt;50mm/yr)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#AB7E75]" />
                        <span className="text-white/70">Moderate (&gt;25mm/yr)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#EF885233]" />
                        <span className="text-white/70">Stable</span>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between text-xs text-white/30">
                <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5" />
                    Source: <span className="text-accent uppercase font-bold">Local Backend (InSAR)</span> · Region: <span className="text-accent uppercase font-bold">Talcher, Odisha</span>
                </div>
                {lastRefresh && <div>Last sync: {lastRefresh}</div>}
            </div>
        </div>
    );
}
