import { useState, useRef, useEffect, useCallback } from "react";
import type { SimMiner, SimAlertEntry, DangerZone } from "./LiveMinerSimulation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Upload, Terminal, Loader2, Bot, User, Image as ImageIcon,
    AlertTriangle, CheckCircle, XCircle, Trash2, Sparkles,
    Mic, MicOff, Volume2, VolumeX, Zap, ShieldAlert
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "http://localhost:3000";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    image?: string;
    streaming?: boolean;
    actions?: ParsedAction[];
}

interface ParsedAction {
    action: string;
    target: string;
    message: string;
    status: "pending" | "executing" | "success" | "failed";
    result?: string;
}

interface AIStatus {
    ollamaOnline: boolean;
    chatModel: { name: string; ready: boolean };
    visionModel: { name: string; ready: boolean };
}

const QUICK_COMMANDS = [
    "Show all miners",
    "Who is in danger?",
    "Gas levels report",
    "Sensor trends",
    "Send alert to all danger zone miners",
];

// ─── Parse [ACTION: ...] tags from AI response ───
function parseActions(content: string): ParsedAction[] {
    const regex = /\[ACTION:\s*(\w+)\s*\|\s*TARGET:\s*([^\]|]+)\s*\|\s*MSG:\s*([^\]]+)\]/gi;
    const actions: ParsedAction[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        actions.push({
            action: match[1].trim(),
            target: match[2].trim(),
            message: match[3].trim(),
            status: "pending",
        });
    }
    return actions;
}

// ─── Strip action tags from display content ───
function stripActionTags(content: string): string {
    return content.replace(/\[ACTION:\s*\w+\s*\|[^\]]+\]/gi, "").trim();
}

interface AITerminalProps {
    simMiners?: SimMiner[];
    simAlerts?: SimAlertEntry[];
    simZones?: DangerZone[];
}

export default function AITerminal({ simMiners, simAlerts, simZones }: AITerminalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "system",
            content: "**UnderGrid AI v2.0** — Actionable Command Center Online\n\nSystems initialized. Memory **active**. Streaming **enabled**. Action execution **armed**. Awaiting command...",
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<AIStatus | null>(null);
    const [statusChecked, setStatusChecked] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [pendingImageName, setPendingImageName] = useState<string>("");
    const [isListening, setIsListening] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const lastAlertCheckRef = useRef<string>("");
    const abortRef = useRef<AbortController | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ─── Check AI status on mount ───
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${API_BASE}/chat/status`);
                setStatus(res.data.data);
            } catch {
                setStatus({ ollamaOnline: false, chatModel: { name: "unknown", ready: false }, visionModel: { name: "llava", ready: false } });
            }
            setStatusChecked(true);
        };
        checkStatus();
    }, []);

    // ─── Proactive alert polling (every 15s) ───
    useEffect(() => {
        const pollAlerts = async () => {
            try {
                const res = await axios.get(`${API_BASE}/chat/alerts`);
                const data = res.data.data;
                if (!data) return;

                const criticalMiners = data.criticalMiners || [];
                const recentIncidents = data.recentIncidents || [];
                const structuralHazards = data.structuralHazards || [];

                if (criticalMiners.length === 0 && recentIncidents.length === 0 && structuralHazards.length === 0) return;

                const alertKey = JSON.stringify({
                    miners: criticalMiners.map((m: any) => m.workerId).sort(),
                    hazards: structuralHazards.length,
                });
                if (alertKey === lastAlertCheckRef.current) return;
                lastAlertCheckRef.current = alertKey;

                let alertLines: string[] = [];
                if (criticalMiners.length > 0) {
                    alertLines.push(`**${criticalMiners.length} miner(s) in hazard zones:**`);
                    criticalMiners.forEach((m: any) => {
                        alertLines.push(`- ⚠️ **${m.name}** (${m.workerId}) in **${m.zone}** — ${m.type} — ${m.distance}m`);
                    });
                }
                if (structuralHazards.length > 0) {
                    alertLines.push(`\n**🏗️ ${structuralHazards.length} structural hazard(s) detected:**`);
                    structuralHazards.forEach((h: any) => {
                        alertLines.push(`- 🔴 **${h.tunnel}** — Crack Probability: **${h.crackProbability?.toFixed(1)}%** — Stress: ${h.structuralStress?.toFixed(2)} MPa — Drone: ${h.droneId}`);
                    });
                }
                if (recentIncidents.length > 0) {
                    alertLines.push(`\n**${recentIncidents.length} unresolved incident(s):**`);
                    recentIncidents.forEach((i: any) => {
                        alertLines.push(`- 🚨 ${i.workerName} (${i.workerId}) — ${i.description}`);
                    });
                }

                if (alertLines.length > 0) {
                    const alertMessage: ChatMessage = {
                        role: "system",
                        content: `🔴 **PROACTIVE ALERT** — ${new Date().toLocaleTimeString()}\n\n${alertLines.join("\n")}`,
                        timestamp: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev, alertMessage]);

                    if (ttsEnabled && (criticalMiners.length > 0 || structuralHazards.length > 0)) {
                        const msg = structuralHazards.length > 0
                            ? `Structural hazard detected. Crack probability exceeding 75 percent.`
                            : `Alert: ${criticalMiners.length} miners in hazard zones.`;
                        const utterance = new SpeechSynthesisUtterance(msg);
                        utterance.rate = 1.1;
                        utterance.pitch = 0.9;
                        speechSynthesis.speak(utterance);
                    }
                }
            } catch { /* silent fail */ }
        };

        const interval = setInterval(pollAlerts, 15000);
        const timeout = setTimeout(pollAlerts, 3000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [ttsEnabled]);

    // ─── Auto-resize textarea ───
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [input]);

    // ─── Build history for backend ───
    const getHistory = useCallback(() => {
        return messages
            .filter(m => m.role === "user" || m.role === "assistant")
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

    // ─── Execute a confirmed action ───
    const executeAction = async (msgIndex: number, actionIndex: number) => {
        setMessages(prev => {
            const updated = [...prev];
            const msg = { ...updated[msgIndex] };
            const actions = [...(msg.actions || [])];
            actions[actionIndex] = { ...actions[actionIndex], status: "executing" };
            msg.actions = actions;
            updated[msgIndex] = msg;
            return updated;
        });

        const action = messages[msgIndex]?.actions?.[actionIndex];
        if (!action) return;

        try {
            const res = await axios.post(`${API_BASE}/chat/execute`, {
                action: action.action,
                target: action.target,
                message: action.message,
            });

            setMessages(prev => {
                const updated = [...prev];
                const msg = { ...updated[msgIndex] };
                const actions = [...(msg.actions || [])];
                actions[actionIndex] = {
                    ...actions[actionIndex],
                    status: res.data.success ? "success" : "failed",
                    result: res.data.message,
                };
                msg.actions = actions;
                updated[msgIndex] = msg;
                return updated;
            });

            if (ttsEnabled && res.data.success) {
                const utterance = new SpeechSynthesisUtterance("Action executed successfully. " + res.data.message);
                utterance.rate = 1.0;
                speechSynthesis.speak(utterance);
            }
        } catch (err: any) {
            setMessages(prev => {
                const updated = [...prev];
                const msg = { ...updated[msgIndex] };
                const actions = [...(msg.actions || [])];
                actions[actionIndex] = {
                    ...actions[actionIndex],
                    status: "failed",
                    result: err.response?.data?.message || "Execution failed",
                };
                msg.actions = actions;
                updated[msgIndex] = msg;
                return updated;
            });
        }
    };

    // ─── Send message with streaming ───
    const sendMessage = async (overrideMsg?: string) => {
        const msg = overrideMsg || input.trim();
        if ((!msg && !pendingImage) || loading) return;

        // Add to command history
        if (msg) {
            setCommandHistory(prev => {
                const newHistory = [...prev.filter(c => c !== msg), msg];
                return newHistory.slice(-50); // Keep last 50 commands
            });
            setHistoryIndex(-1);
        }

        const userMessage: ChatMessage = {
            role: "user",
            content: msg || "Analyze this image",
            timestamp: new Date().toISOString(),
            image: pendingImage || undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        const currentImage = pendingImage;
        setPendingImage(null);
        setPendingImageName("");

        const assistantPlaceholder: ChatMessage = {
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            streaming: true,
        };
        setMessages(prev => [...prev, assistantPlaceholder]);

        try {
            const history = getHistory();
            const url = currentImage ? `${API_BASE}/chat/vision` : `${API_BASE}/chat`;
            // Build simulation context to send with each message
            const simContext = (simMiners && simMiners.length > 0) ? {
                miners: simMiners,
                alerts: simAlerts || [],
                zones: simZones || [],
            } : undefined;

            const body = currentImage
                ? { message: msg, image: currentImage }
                : { message: msg, history, simContext };

            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

                    for (const line of lines) {
                        try {
                            const json = JSON.parse(line.slice(6));
                            if (json.token) {
                                fullContent += json.token;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastIdx = updated.length - 1;
                                    updated[lastIdx] = { ...updated[lastIdx], content: fullContent, streaming: true };
                                    return updated;
                                });
                            }
                            if (json.done) {
                                // Parse actions from completed response
                                const actions = parseActions(fullContent);
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastIdx = updated.length - 1;
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        content: fullContent,
                                        streaming: false,
                                        timestamp: new Date().toISOString(),
                                        actions: actions.length > 0 ? actions : undefined,
                                    };
                                    return updated;
                                });
                            }
                            if (json.error) { fullContent += `\n\n⚠️ ${json.error}`; }
                        } catch { /* skip */ }
                    }
                }
            }

            // Ensure final state + parse actions
            setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.streaming) {
                    const actions = parseActions(fullContent);
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: fullContent || "⚠️ No response received.",
                        streaming: false,
                        actions: actions.length > 0 ? actions : undefined,
                    };
                }
                return updated;
            });

            if (ttsEnabled && fullContent) {
                const clean = stripActionTags(fullContent);
                const utterance = new SpeechSynthesisUtterance(clean.slice(0, 500));
                utterance.rate = 1.0;
                speechSynthesis.speak(utterance);
            }

        } catch (err: any) {
            if (err.name === "AbortError") return;
            setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                    role: "assistant",
                    content: `⚠️ **SYSTEM ERROR:** ${err.message || "AI engine unreachable."}`,
                    timestamp: new Date().toISOString(),
                    streaming: false,
                };
                return updated;
            });
        }
        setLoading(false);
        abortRef.current = null;
    };

    // ─── Image upload ───
    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(",")[1];
            setPendingImage(base64);
            setPendingImageName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleImageUpload(file);
    };

    // ─── CLI Command History (Arrow Keys) ───
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
            return;
        }

        if (e.key === "ArrowUp" && commandHistory.length > 0) {
            e.preventDefault();
            const newIndex = historyIndex === -1
                ? commandHistory.length - 1
                : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
            // Move cursor to end
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.value.length;
                    textareaRef.current.selectionEnd = textareaRef.current.value.length;
                }
            }, 0);
            return;
        }

        if (e.key === "ArrowDown" && historyIndex !== -1) {
            e.preventDefault();
            if (historyIndex >= commandHistory.length - 1) {
                setHistoryIndex(-1);
                setInput("");
            } else {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
            return;
        }
    };

    // ─── Voice: STT ───
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessages(prev => [...prev, {
                role: "system", content: "⚠️ **Speech Recognition not supported.** Try Chrome or Edge.",
                timestamp: new Date().toISOString(),
            }]);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
            setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const toggleTTS = () => {
        if (ttsEnabled) speechSynthesis.cancel();
        setTtsEnabled(!ttsEnabled);
    };

    const clearChat = () => {
        if (abortRef.current) abortRef.current.abort();
        speechSynthesis.cancel();
        setMessages([{
            role: "system",
            content: "**UnderGrid AI v2.0** — Terminal cleared. Memory reset. Command history preserved. Awaiting command...",
            timestamp: new Date().toISOString(),
        }]);
        lastAlertCheckRef.current = "";
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
            {/* ─── Header ─── */}
            <div className="glass-card-accent p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-muted/20 border border-accent/20 flex items-center justify-center shadow-lg">
                        <Terminal className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black uppercase tracking-tight italic flex items-center gap-2">
                            UnderGrid AI
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 font-bold">v2.0</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-muted/10 text-accent-muted border border-accent-muted/20 font-bold uppercase tracking-widest">STREAM</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 font-bold uppercase tracking-widest">ACTION</span>
                        </h2>
                        <p className="text-[11px] text-accent-muted font-bold uppercase tracking-widest text-[9px] mt-0.5">Actionable Command Center • Trends • Voice • CLI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {statusChecked && status && (
                        <div className="flex items-center gap-2">
                            <StatusBadge label="Ollama" ready={status.ollamaOnline} />
                            <StatusBadge label="Chat" ready={status.chatModel.ready} />
                            <StatusBadge label="Vision" ready={status.visionModel.ready} />
                        </div>
                    )}
                    <button onClick={toggleTTS}
                        className={`p-2 rounded-lg border transition-all ${ttsEnabled
                            ? "bg-accent/10 border-accent/30 text-accent"
                            : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-accent hover:border-accent/20"}`}
                        title={ttsEnabled ? "Disable voice output" : "Enable voice output"}>
                        {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button onClick={clearChat} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-red-400/30 hover:bg-red-400/5 transition-all text-white/30 hover:text-red-400" title="Clear chat">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex-1 overflow-y-auto glass-card p-4 space-y-3 mb-4"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={dragOver ? { borderColor: "rgba(var(--color-accent-rgb), 0.4)", background: "rgba(var(--color-accent-rgb), 0.02)" } : {}}>
                {dragOver && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl pointer-events-none">
                        <div className="flex flex-col items-center gap-2 text-accent">
                            <Upload className="w-8 h-8" />
                            <span className="text-sm font-black uppercase tracking-widest">Drop image for analysis</span>
                        </div>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} msgIndex={i} onExecuteAction={executeAction} />
                    ))}
                </AnimatePresence>

                {loading && !messages[messages.length - 1]?.streaming && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-accent/60 font-black uppercase tracking-widest">Connecting to AI engine</span>
                            <span className="inline-flex gap-0.5">
                                {[0, 1, 2].map((d) => (
                                    <motion.span key={d} className="w-1 h-1 rounded-full bg-accent/50"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: d * 0.2 }} />
                                ))}
                            </span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ─── Quick Commands ─── */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {QUICK_COMMANDS.map((cmd) => (
                    <button key={cmd} onClick={() => sendMessage(cmd)} disabled={loading}
                        className="flex-shrink-0 text-[10px] px-3 py-1.5 rounded-lg bg-surface/40 border border-accent/10 text-accent/60 hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all disabled:opacity-30 font-black uppercase tracking-widest">
                        {cmd}
                    </button>
                ))}
            </div>

            {/* ─── Pending Image ─── */}
            {pendingImage && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
                    <ImageIcon className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-[12px] text-accent-muted truncate flex-1">{pendingImageName}</span>
                    <button onClick={() => { setPendingImage(null); setPendingImageName(""); }} className="text-white/30 hover:text-red-400 transition-colors">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ─── Input ─── */}
            <div className="glass-card-accent p-3 flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-accent/5 transition-all text-white/30 hover:text-accent flex-shrink-0"
                    title="Upload tunnel image">
                    <Upload className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ""; }} />

                <button onClick={toggleListening}
                    className={`p-2.5 rounded-lg border transition-all flex-shrink-0 ${isListening
                        ? "bg-red-400/10 border-red-400/30 text-red-400 animate-pulse"
                        : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-accent hover:border-accent/30 hover:bg-accent/5"}`}
                    title={isListening ? "Stop listening" : "Voice input"}>
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <textarea ref={textareaRef} value={input}
                    onChange={(e) => { setInput(e.target.value); setHistoryIndex(-1); }}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "🎙️ Listening..." : pendingImage ? "Describe what to analyze..." : "Enter command... (↑↓ for history)"}
                    rows={1}
                    className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/20 resize-none outline-none font-mono py-2"
                    disabled={loading} />

                <button onClick={() => sendMessage()}
                    disabled={loading || (!input.trim() && !pendingImage)}
                    className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

/* ─── Status Badge ─── */
function StatusBadge({ label, ready }: { label: string; ready: boolean }) {
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${ready
            ? "bg-accent/5 border-accent/20 text-accent/80 shadow-[0_0_10px_rgba(239,136,82,0.1)]"
            : "bg-surface/10 border-white/10 text-white/30"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-accent animate-pulse" : "bg-white/20"}`} />
            {label}
        </div>
    );
}

/* ─── Action Confirm Card ─── */
function ActionConfirmCard({ action, index, msgIndex, onExecute }: {
    action: ParsedAction; index: number; msgIndex: number;
    onExecute: (msgIndex: number, actionIndex: number) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 rounded-lg overflow-hidden hazard-stripe"
        >
            <div className="bg-black/80 backdrop-blur-sm m-[2px] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-accent">Action Requires Confirmation</span>
                </div>
                <div className="text-[12px] text-white/60 mb-1 font-bold">
                    <span className="text-accent/60 uppercase text-[10px] tracking-widest mr-2">ACTION</span> {action.action}
                </div>
                <div className="text-[12px] text-white/60 mb-1 font-bold">
                    <span className="text-accent/60 uppercase text-[10px] tracking-widest mr-2">TARGET</span> {action.target}
                </div>
                <div className="text-[12px] text-white/60 mb-3 font-bold">
                    <span className="text-accent/60 uppercase text-[10px] tracking-widest mr-2">MSG</span> {action.message}
                </div>

                {action.status === "pending" && (
                    <button
                        onClick={() => onExecute(msgIndex, index)}
                        className="action-confirm-btn flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        CONFIRM & EXECUTE
                    </button>
                )}

                {action.status === "executing" && (
                    <div className="flex items-center gap-2 text-amber-400 text-[12px]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="font-mono">Executing protocol...</span>
                    </div>
                )}

                {action.status === "success" && (
                    <div className="flex items-center gap-2 text-accent text-[12px] font-black uppercase tracking-widest">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{action.result || "Action executed successfully."}</span>
                    </div>
                )}

                {action.status === "failed" && (
                    <div className="flex items-center gap-2 text-red-400 text-[12px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="font-mono">{action.result || "Execution failed."}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, msgIndex, onExecuteAction }: {
    message: ChatMessage; msgIndex: number;
    onExecuteAction: (msgIndex: number, actionIndex: number) => void;
}) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const displayContent = message.actions ? stripActionTags(message.content) : message.content;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
        >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSystem
                ? "bg-accent/10 border border-accent/20"
                : isUser ? "bg-white/[0.06] border border-white/[0.08]"
                    : "bg-accent-muted/10 border border-accent-muted/20"}`}>
                {isSystem ? <Sparkles className="w-3.5 h-3.5 text-accent" /> :
                    isUser ? <User className="w-3.5 h-3.5 text-white/50" /> :
                        <Bot className="w-3.5 h-3.5 text-accent-muted" />}
            </div>

            <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-xl text-[13px] leading-relaxed ${isSystem
                    ? "bg-accent/5 border border-accent/10 text-accent/80"
                    : isUser ? "bg-white/[0.06] border border-white/[0.08] text-white/80"
                        : "bg-surface-elevated/40 border border-accent-muted/10 text-white/70 shadow-sm"}`}>
                    {message.image && (
                        <div className="mb-2">
                            <img src={`data:image/jpeg;base64,${message.image}`} alt="Uploaded"
                                className="max-w-[200px] max-h-[150px] rounded-lg border border-white/[0.08] object-cover" />
                        </div>
                    )}
                    <div className="ai-terminal-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                        {message.streaming && <span className="inline-block w-2 h-4 bg-accent/80 ml-0.5 animate-blink-cursor" />}
                    </div>

                    {/* ─── Action Confirm Cards ─── */}
                    {message.actions && message.actions.map((action, idx) => (
                        <ActionConfirmCard
                            key={idx}
                            action={action}
                            index={idx}
                            msgIndex={msgIndex}
                            onExecute={onExecuteAction}
                        />
                    ))}
                </div>

                <div className={`text-[10px] text-white/15 mt-1 font-mono ${isUser ? "text-right" : ""}`}>
                    {message.streaming ? <span className="text-accent/40 uppercase tracking-widest text-[9px] font-black">streaming...</span> :
                        new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </motion.div>
    );
}



