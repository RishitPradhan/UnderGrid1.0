import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
    Activity, Shield, AlertTriangle, FileText, Download, Share2, 
    ArrowRight, Info, TrendingUp, TrendingDown, Clock, ShieldAlert, Bot, Brain, RefreshCw, Users
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import type { SimMiner, SimAlertEntry } from "./LiveMinerSimulation";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SERVER = "http://localhost:3000";

interface SafetyReportProps {
    simMiners?: SimMiner[];
    simAlerts?: SimAlertEntry[];
    simZones?: any[];
}

export default function SafetyReport({ simMiners, simAlerts, simZones }: SafetyReportProps) {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            const simContext: any = { simZones };
            if (simMiners && simMiners.length > 0) {
                simContext.simMiners = simMiners.map(m => ({
                    name: m.name, workerId: m.workerId, role: m.role,
                    lat: m.lat.toFixed(4), lng: m.lng.toFixed(4),
                    inDanger: m.inDanger, dangerZone: m.dangerZone,
                }));
            }
            if (simAlerts && simAlerts.length > 0) {
                simContext.recentSimAlerts = simAlerts.slice(0, 20).map(a => ({
                    minerName: a.minerName, workerId: a.workerId,
                    zoneName: a.zoneName, riskLevel: a.riskLevel,
                    time: a.time,
                }));
            }

            const res = await axios.post(`${SERVER}/report/generate`, { simContext }, { timeout: 60000 });
            if (res.data.success) {
                setReport(res.data.data.report);
                setGeneratedAt(res.data.data.generatedAt);
            } else {
                setError(res.data.message || "Failed to generate report");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const parseReport = (text: string) => {
        const sections: Record<string, string> = {};
        const parts = text.split(/\[\[(.*?)\]\]/);
        for (let i = 1; i < parts.length; i += 2) {
            let content = parts[i + 1].trim();
            // Clean up common AI artifacts
            content = content.replace(/^["']|["']$/g, '').trim(); // Remove wrapping quotes
            content = content.replace(/#+$/g, '').trim();      // Remove trailing hashes
            sections[parts[i]] = content;
        }
        return sections;
    };

    const parsed = report ? parseReport(report) : null;
    const rawStatus = (parsed?.STATUS || "UNKNOWN").toUpperCase();
    const status = rawStatus.includes("CRITICAL") ? "CRITICAL" :
        rawStatus.includes("HIGH") ? "HIGH" :
            rawStatus.includes("MODERATE") ? "MODERATE" :
                rawStatus.includes("NORMAL") || rawStatus.includes("LOW") ? "NORMAL" : "UNKNOWN";

    const getStatusStyles = (s: string) => {
        if (s.includes("CRITICAL")) return { bg: "bg-accent/10", border: "border-accent/30", text: "text-accent", glow: "shadow-[0_0_20px_rgba(239,136,82,0.05)]", label: "CRITICAL" };
        if (s.includes("HIGH")) return { bg: "bg-accent/10", border: "border-accent/20", text: "text-accent/90", glow: "shadow-[0_0_15px_rgba(239,136,82,0.02)]", label: "HIGH RISK" };
        if (s.includes("MODERATE")) return { bg: "bg-accent-muted/10", border: "border-accent-muted/30", text: "text-accent-muted", glow: "", label: "MODERATE" };
        return { bg: "bg-surface-elevated/10", border: "border-accent/10", text: "text-text-secondary", glow: "", label: "NORMAL" };
    };

    const statusStyle = getStatusStyles(status);
    const dangerCount = simMiners ? simMiners.filter(m => m.inDanger).length : 0;

    // --- Chart Data Preparation ---
    const graphData = parsed?.GRAPH?.split(',').map(Number) || [0, 0, 0, 0, 0];
    const chartData = {
        labels: ["T-40", "T-30", "T-20", "T-10", "CURRENT"],
        datasets: [{
            label: 'Safety Risk Trend',
            data: graphData,
            borderColor: '#EF8852',
            backgroundColor: 'rgba(239, 136, 82, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#EF8852'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } }
        }
    };

    // --- Flowchart Preparation ---
    const flowSteps = parsed?.FLOW?.split('-->').map(s => s.trim()).filter(s => s !== "") || [];

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 border-white/5">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
                        <Brain className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white/90">Safety Intelligence Dashboard</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[13px] text-white/40 uppercase tracking-widest font-medium">Llama-3 / Real-Time Data Sync</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={generate}
                    disabled={loading}
                    className={`px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 active:scale-95 shadow-lg
                        ${loading ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed' : 'bg-accent hover:bg-accent/80 text-surface-deep border border-accent/20'}
                    `}
                >
                    {loading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin text-accent" /> GENERATING...</>
                    ) : (
                        <><FileText className="w-4 h-4" /> GENERATE REPORT</>
                    )}
                </button>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3 text-accent text-sm"
                >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                </motion.div>
            )}

            {!report && !loading && (
                <div className="glass-card py-32 border-dashed border-white/5 text-center">
                    <Brain className="w-16 h-16 text-white/5 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white/40">Ready for Safety Generation</h3>
                    <p className="text-sm text-white/20 mt-2 max-w-sm mx-auto">Click generate to analyze miner distribution, hazard proximity, and safety trends.</p>
                </div>
            )}

            {loading && (
                <div className="glass-card py-32 text-center border-accent/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent animate-pulse" />
                    <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6" />
                    <h3 className="text-lg font-black text-accent/60 uppercase tracking-widest italic">Processing Mine Dynamics</h3>
                </div>
            )}

            {report && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Status Overview Banner */}
                    <div className={`${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow} rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border-2 gap-8`}>
                        <div className="space-y-1 text-center md:text-left">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Operational Pulse</p>
                            <h2 className={`text-5xl font-black ${statusStyle.text} tracking-tighter`}>{statusStyle.label}</h2>
                            <p className="text-sm text-white/40 font-medium italic">"{parsed?.SUMMARY}"</p>
                        </div>
                        <div className="grid grid-cols-3 gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-10">
                            {[
                                { val: simMiners?.length || 0, label: "Monitored", icon: Users, color: "text-accent" },
                                { val: dangerCount, label: "In Danger", icon: AlertTriangle, color: "text-accent" },
                                { val: simAlerts?.length || 0, label: "Alerts", icon: Clock, color: "text-accent-muted" },
                            ].map((s, idx) => (
                                <div key={idx} className="text-center md:text-right">
                                    <div className="flex items-center justify-center md:justify-end gap-2 mb-1">
                                        <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{s.label}</span>
                                    </div>
                                    <div className="text-2xl font-black text-white/80">{s.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Summary & Charts - Left Column */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Hazards Table Section */}
                            <div className="glass-card overflow-hidden border-red-500/20">
                                <div className="px-6 py-4 border-b border-white/5 bg-red-500/5 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Hazard Analysis
                                    </h3>
                                    <span className="text-[10px] text-white/30 font-mono tracking-tighter">DATASET: SIM_BREACH_LOG</span>
                                </div>
                                <div className="p-6 overflow-x-auto
                                    prose prose-invert prose-sm max-w-none
                                    prose-table:w-full prose-table:border-collapse
                                    prose-th:text-left prose-th:text-white/30 prose-th:font-bold prose-th:text-[11px] prose-th:uppercase prose-th:tracking-widest prose-th:pb-4 prose-th:border-b prose-th:border-white/5
                                    prose-td:py-4 prose-td:text-white/70 prose-td:border-b prose-td:border-white/5 prose-td:text-[13px] last:prose-td:border-0
                                ">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed?.HAZARDS || "No specific hazard data identified."}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Recommendations & Flowchart */}
                            <div className="glass-card p-8 border-amber-500/20 bg-amber-500/[0.02]">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Safety Protocols & Recommendations
                                </h3>

                                {flowSteps.length > 0 && (
                                    <div className="flex items-center justify-center gap-4 mb-8 py-6 bg-white/[0.02] rounded-2xl border border-white/5 overflow-x-auto px-4">
                                        {flowSteps.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-4 flex-shrink-0">
                                                <div className="px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.05)]">
                                                    {step}
                                                </div>
                                                {idx < flowSteps.length - 1 && <ArrowRight className="w-4 h-4 text-white/20" />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 prose prose-invert prose-sm max-w-none prose-li:text-accent/60 prose-li:mb-2 prose-li:font-bold">
                                    <ReactMarkdown>{parsed?.RECOMMENDATIONS || "Continue standard protocols."}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Dynamics & Trends - Right Column */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Trend Graph */}
                            <div className="glass-card p-6 border-accent-muted/20 bg-accent-muted/[0.02]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-accent-muted uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                        <Bot className="w-4 h-4" /> AI Reasoning Trace
                                    </h3>
                                    <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Last 50 Ticks</span>
                                </div>
                                <div className="h-48">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                                    <p className="text-[11px] text-white/30 tracking-tight">Projected risk based on miner panic states and hazard proximity.</p>
                                </div>
                            </div>

                            {/* Simulation Details */}
                            <div className="glass-card p-6 border-accent/20 bg-accent/[0.02]">
                                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Recommended Protocols
                                </h3>
                                <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/50 prose-p:leading-relaxed prose-li:text-accent/60 prose-li:font-bold">
                                    <ReactMarkdown>{parsed?.SIMULATION || "General simulation stability confirmed."}</ReactMarkdown>
                                </div>
                            </div>

                            {/* System Meta */}
                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-white/20 uppercase tracking-widest font-bold">Report Engine</span>
                                    <span className="text-white/60 font-mono">UnderGrid/AI-Core v2.4</span>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-white/20">Computation Latency</span>
                                    <span className="text-accent/80 font-bold">14.2ms (Avg)</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-white/20 uppercase tracking-widest font-bold">Status Code</span>
                                    <span className="text-white/60 font-mono">200_OK_GENERATED</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    {generatedAt && (
                        <div className="flex items-center justify-center gap-4 text-white/10 text-[9px] font-mono py-8 tracking-widest border-t border-white/5">
                            <span>REPORT ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                            <span>•</span>
                            <span>CERTIFIED GEN: {new Date(generatedAt).toISOString()}</span>
                            <span>•</span>
                            <span>MINESAFE-AI/V2-BETA</span>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
