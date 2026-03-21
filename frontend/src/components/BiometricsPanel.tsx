import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Thermometer, Wind, Brain, X, AlertTriangle, Activity } from "lucide-react";
import { useSimContext, type MinerVitals } from "@/context/SimContext";
import type { SimMiner } from "@/components/LiveMinerSimulation";

const SERVER = "http://localhost:3000";

interface BiometricsPanelProps {
    miner: SimMiner | null;
    onClose: () => void;
}

export default function BiometricsPanel({ miner, onClose }: BiometricsPanelProps) {
    const { simBiometrics, setSimBiometrics } = useSimContext();
    const [ekgPoints, setEkgPoints] = useState<number[]>([]);
    const sseRef = useRef<EventSource | null>(null);

    // Connect to SSE stream
    useEffect(() => {
        if (sseRef.current) return;
        const sse = new EventSource(`${SERVER}/biometrics/stream`);
        sseRef.current = sse;

        sse.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                setSimBiometrics(data);
            } catch { }
        };

        return () => {
            sse.close();
            sseRef.current = null;
        };
    }, []);

    // EKG waveform simulator
    useEffect(() => {
        if (!miner) return;
        const vitals = simBiometrics[miner.id];
        if (!vitals) return;

        const interval = setInterval(() => {
            setEkgPoints(prev => {
                const next = [...prev];
                const hr = vitals.heartRate;
                // Generate realistic-ish EKG pattern
                const t = Date.now() / (60000 / hr);
                const phase = t % 1;
                let y = 50;
                if (phase < 0.1) y = 50 - phase * 100;
                else if (phase < 0.15) y = 40 + (phase - 0.1) * 800;
                else if (phase < 0.2) y = 80 - (phase - 0.15) * 600;
                else if (phase < 0.25) y = 50 + (phase - 0.2) * 200;
                else y = 50 + Math.sin(phase * Math.PI * 2) * 2;

                next.push(y);
                if (next.length > 120) next.shift();
                return next;
            });
        }, 40);

        return () => clearInterval(interval);
    }, [miner, simBiometrics]);

    if (!miner) return null;
    const vitals = simBiometrics[miner.id];
    if (!vitals) return null;

    const isRestMandate = vitals.fatigue < 30;
    const isHighStress = vitals.stressIndex > 60;

    const ekgPath = ekgPoints.map((y, i) => `${(i / 120) * 100},${y}`).join(" ");

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-3 right-3 z-[2000] w-80"
            >
                <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,212,255,0.1)] overflow-hidden">
                    {/* REST MANDATE Banner */}
                    {isRestMandate && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            className="bg-red-500/20 border-b border-red-400/30 px-4 py-2"
                        >
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
                                <AlertTriangle className="w-4 h-4" />
                                ⚠ REST MANDATE — Fatigue Critical
                            </div>
                        </motion.div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${miner.color}20` }}>
                                <Activity className="w-4 h-4" style={{ color: miner.color }} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{miner.name}</h3>
                                <span className="text-[10px] text-white/40 font-mono">{miner.workerId} • {miner.role}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* EKG Waveform */}
                    <div className="px-4 pt-3">
                        <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">ECG Waveform</div>
                        <div className="h-16 rounded-lg bg-black/60 border border-white/5 overflow-hidden relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                    points={ekgPath}
                                    fill="none"
                                    stroke="#00ff88"
                                    strokeWidth="1.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                            <div className="absolute top-1 right-2 text-[10px] font-mono text-emerald-400">
                                {vitals.heartRate.toFixed(0)} BPM
                            </div>
                        </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 gap-2 p-4">
                        <VitalCard icon={Heart} label="Heart Rate" value={`${vitals.heartRate.toFixed(0)}`} unit="BPM"
                            color={vitals.heartRate > 110 ? "#ff3333" : vitals.heartRate > 90 ? "#f59e0b" : "#00ff88"}
                            percent={(vitals.heartRate - 50) / 80 * 100} />
                        <VitalCard icon={Thermometer} label="Core Temp" value={vitals.coreTemp.toFixed(1)} unit="°C"
                            color={vitals.coreTemp > 38 ? "#ff3333" : vitals.coreTemp > 37.5 ? "#f59e0b" : "#00d4ff"}
                            percent={(vitals.coreTemp - 35) / 5 * 100} />
                        <VitalCard icon={Wind} label="O₂ Level" value={vitals.o2Level.toFixed(0)} unit="%"
                            color={vitals.o2Level < 93 ? "#ff3333" : vitals.o2Level < 95 ? "#f59e0b" : "#00ff88"}
                            percent={vitals.o2Level} />
                        <VitalCard icon={Brain} label="Fatigue" value={vitals.fatigue.toFixed(0)} unit="%"
                            color={vitals.fatigue < 30 ? "#ff3333" : vitals.fatigue < 50 ? "#f59e0b" : "#a855f7"}
                            percent={vitals.fatigue} />
                    </div>

                    {/* Stress Index */}
                    <div className="px-4 pb-4">
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase text-white/30">Stress Index</span>
                                <span className={`text-xs font-mono font-bold ${isHighStress ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                                    {vitals.stressIndex.toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, vitals.stressIndex)}%`,
                                        background: `linear-gradient(90deg, #00ff88, #f59e0b, #ff3333)`,
                                    }} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function VitalCard({ icon: Icon, label, value, unit, color, percent }: {
    icon: any; label: string; value: string; unit: string; color: string; percent: number;
}) {
    return (
        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3 h-3" style={{ color }} />
                <span className="text-[9px] uppercase text-white/30">{label}</span>
            </div>
            <div className="text-lg font-bold font-mono leading-none" style={{ color }}>
                {value}<span className="text-[10px] text-white/30 ml-1">{unit}</span>
            </div>
            <div className="h-1 mt-2 bg-black/60 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, percent)}%`, background: color }} />
            </div>
        </div>
    );
}
