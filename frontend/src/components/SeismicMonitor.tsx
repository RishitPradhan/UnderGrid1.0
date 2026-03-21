import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio, AlertTriangle, RotateCcw } from "lucide-react";
import { useSimContext, type SeismicEvent } from "@/context/SimContext";

const SERVER = "http://localhost:3000";

export default function SeismicMonitor() {
    const { simSeismicEvents, setSimSeismicEvents } = useSimContext();
    const [waveform, setWaveform] = useState<number[]>(new Array(200).fill(50));
    const sseRef = useRef<EventSource | null>(null);
    const [latestEvent, setLatestEvent] = useState<SeismicEvent | null>(null);

    const handleReset = () => {
        setSimSeismicEvents([]);
        setWaveform(new Array(200).fill(50));
        setLatestEvent(null);
    };

    // Connect SSE
    useEffect(() => {
        if (sseRef.current) return;
        const sse = new EventSource(`${SERVER}/seismic/stream`);
        sseRef.current = sse;

        sse.onmessage = (e) => {
            try {
                const event: SeismicEvent = JSON.parse(e.data);
                setLatestEvent(event);
                setSimSeismicEvents([event, ...simSeismicEvents].slice(0, 50));

                // Inject spike into waveform
                setWaveform(prev => {
                    const spike = [...prev];
                    const spikeHeight = event.magnitude * 15;
                    for (let i = 0; i < 15; i++) {
                        const y = 50 + (Math.random() > 0.5 ? 1 : -1) * spikeHeight * Math.exp(-i / 4) * Math.sin(i * 2);
                        spike.push(y);
                    }
                    return spike.slice(-200);
                });
            } catch { }
        };

        return () => { sse.close(); sseRef.current = null; };
    }, []);

    // Ambient noise
    useEffect(() => {
        const interval = setInterval(() => {
            setWaveform(prev => {
                const next = [...prev, 50 + (Math.random() - 0.5) * 6];
                return next.slice(-200);
            });
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const wavePath = waveform.map((y, i) => `${(i / 200) * 100},${y}`).join(" ");

    const typeColor: Record<string, string> = {
        crack: "#ff3333",
        settling: "#f59e0b",
        vibration: "#06b6d4",
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="glass-card-accent p-5">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Seismic Monitoring</h2>
                        <p className="text-white/40 text-xs">Real-time acoustic & micro-tremor detection</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-mono font-bold ${latestEvent ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-white/40"}`}>
                            {latestEvent ? "● LIVE" : "○ WAITING"}
                        </span>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-white/40 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
                            title="Clear all seismic events and map ripples"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Oscilloscope */}
            <div className="glass-card p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Radio className="w-3 h-3 text-cyan-400" /> Seismograph
                </div>
                <div className="h-40 rounded-xl bg-black/60 border border-white/5 overflow-hidden relative">
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {[20, 40, 60, 80].map(y => (
                            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                        ))}
                        {[20, 40, 60, 80].map(x => (
                            <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                        ))}
                    </svg>

                    {/* Waveform */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline points={wavePath} fill="none" stroke="#00ff88" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.9" />
                        <polyline points={wavePath} fill="none" stroke="#00ff88" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.15" />
                    </svg>

                    {/* Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.02] to-transparent animate-pulse" />

                    {/* Center line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06]" />

                    {/* Labels */}
                    <div className="absolute bottom-2 left-3 text-[9px] font-mono text-white/20">0Hz</div>
                    <div className="absolute bottom-2 right-3 text-[9px] font-mono text-white/20">200Hz</div>
                </div>
            </div>

            {/* Event Log */}
            <div className="glass-card p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Recent Events</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {simSeismicEvents.length === 0 && (
                        <div className="text-center py-6 text-white/20 text-xs">No events detected yet...</div>
                    )}
                    {simSeismicEvents.slice(0, 10).map((ev, i) => (
                        <motion.div
                            key={ev.id}
                            initial={i === 0 ? { opacity: 0, y: -10 } : {}}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5"
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${typeColor[ev.type] || "#888"}20` }}>
                                <AlertTriangle className="w-4 h-4" style={{ color: typeColor[ev.type] || "#888" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-white/80 capitalize">{ev.type}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold"
                                        style={{
                                            background: `${typeColor[ev.type] || "#888"}15`,
                                            color: typeColor[ev.type] || "#888"
                                        }}>
                                        M{ev.magnitude}
                                    </span>
                                </div>
                                <div className="text-[10px] text-white/30 font-mono">
                                    {ev.epicenter.lat.toFixed(4)}°N, {ev.epicenter.lng.toFixed(4)}°E — {ev.depth.toFixed(0)}m deep
                                </div>
                            </div>
                            <div className="text-[9px] text-white/20 font-mono">
                                {new Date(ev.timestamp).toLocaleTimeString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
