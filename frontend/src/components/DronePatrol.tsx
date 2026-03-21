import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, Play, Pause, RotateCcw, Crosshair } from "lucide-react";

const PATROL_ROUTE: [number, number][] = [
    [20.9420, 85.1730],
    [20.9440, 85.1880],
    [20.9490, 85.2030],
    [20.9540, 85.2130],
    [20.9590, 85.2230],
    [20.9620, 85.2380],
    [20.9590, 85.2530],
    [20.9540, 85.2630],
    [20.9490, 85.2680],
    [20.9440, 85.2580],
    [20.9420, 85.2430],
    [20.9390, 85.2230],
    [20.9370, 85.2030],
    [20.9390, 85.1880],
    [20.9420, 85.1730],
];

export default function DronePatrol() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapObj, setMapObj] = useState<any>(null);
    const [loaded, setLoaded] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const droneMarkerRef = useRef<any>(null);
    const trailRef = useRef<any>(null);
    const animFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const LOOP_DURATION = 30000; // 30s per loop

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapObj) return;
        const L = (window as any).L;
        if (!L) return;

        const center: [number, number] = [20.9500, 85.2200];
        const map = L.map(mapRef.current, { center, zoom: 13 });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Mining area polygon
        L.polygon([
            [20.9345, 85.1595], [20.9345, 85.281], [20.9661, 85.281], [20.9661, 85.1595]
        ], { color: "#EF8852", weight: 1.5, opacity: 0.3, fillColor: "#EF8852", fillOpacity: 0.02, dashArray: "6,4" })
            .addTo(map).bindPopup("<b style='color:#EF8852'>Mining Area Boundary</b>");

        // Patrol route line
        const routeLine = L.polyline(PATROL_ROUTE, {
            color: "#AB7E75", weight: 2, opacity: 0.3, dashArray: "8,6",
        }).addTo(map);

        // Drone marker
        const droneIcon = L.divIcon({
            html: `<div style="width:28px;height:28px;background:#EF8852;border-radius:50%;border:3px solid #050505;box-shadow:0 0 16px rgba(239,136,82,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">🛸</div>`,
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });

        const droneMarker = L.marker(PATROL_ROUTE[0], { icon: droneIcon }).addTo(map);
        droneMarker.bindPopup("<b style='color:#EF8852'>Patrol Drone</b><br/><span style='color:#888;font-size:11px'>Autonomous structural scan</span>");

        // Trail
        const trail = L.polyline([], { color: "#EF8852", weight: 3, opacity: 0.6 }).addTo(map);

        droneMarkerRef.current = droneMarker;
        trailRef.current = trail;
        setMapObj(map);
        setLoaded(true);

        return () => { map.remove(); };
    }, []);

    // Interpolate position along route
    const interpolate = (t: number): [number, number] => {
        const totalSegments = PATROL_ROUTE.length - 1;
        const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
        const localT = (t * totalSegments) - segment;

        const [lat1, lng1] = PATROL_ROUTE[segment];
        const [lat2, lng2] = PATROL_ROUTE[segment + 1];

        return [
            lat1 + (lat2 - lat1) * localT,
            lng1 + (lng2 - lng1) * localT,
        ];
    };

    // Animation loop
    useEffect(() => {
        if (!playing || !droneMarkerRef.current || !trailRef.current) return;

        startTimeRef.current = Date.now() - (progress * LOOP_DURATION);
        const trailPoints: [number, number][] = [];

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const t = (elapsed % LOOP_DURATION) / LOOP_DURATION;
            setProgress(t);

            const pos = interpolate(t);
            droneMarkerRef.current.setLatLng(pos);

            trailPoints.push(pos);
            if (trailPoints.length > 100) trailPoints.shift();
            trailRef.current.setLatLngs([...trailPoints]);

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [playing]);

    const reset = () => {
        setPlaying(false);
        setProgress(0);
        if (droneMarkerRef.current) droneMarkerRef.current.setLatLng(PATROL_ROUTE[0]);
        if (trailRef.current) trailRef.current.setLatLngs([]);
    };

    const toggle = () => {
        setFullscreen(!fullscreen);
        setTimeout(() => mapObj?.invalidateSize(), 150);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-accent" /> Drone Patrol Simulation
                    </h3>
                    <p className="text-[10px] text-accent-muted font-bold uppercase tracking-widest mt-0.5">Autonomous structural scan path</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPlaying(!playing)}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${playing ? "bg-accent/20 text-accent border border-accent/40" : "bg-accent/10 text-accent border border-accent/20"}`}>
                        {playing ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start Patrol</>}
                    </button>
                    <button onClick={reset} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button onClick={toggle} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
                        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        {fullscreen ? "Exit" : "Expand"}
                    </button>
                </div>
            </div>

            {/* Map */}
            <div className={`glass-card overflow-hidden transition-all ${fullscreen ? "fixed inset-4 z-50" : "relative"}`}>
                <div ref={mapRef} className={`w-full ${fullscreen ? "h-full" : "h-[500px]"}`} style={{ minHeight: 400 }} />
                {!loaded && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {fullscreen && (
                    <button onClick={toggle} className="absolute top-4 right-4 z-20 btn-ghost text-xs px-3 py-1.5">
                        <Minimize2 className="w-3.5 h-3.5 inline mr-1" /> Close
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <span className="text-[11px] text-white/25 font-mono w-10 text-right">{Math.round(progress * 100)}%</span>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 text-[11px] text-white/25">
                <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-accent" /> {PATROL_ROUTE.length} waypoints</span>
                <span>Loop: {LOOP_DURATION / 1000}s</span>
                <span className={playing ? "text-accent font-bold" : "text-white/25"}>
                    {playing ? "● Patrolling" : "○ Idle"}
                </span>
            </div>
        </div>
    );
}
