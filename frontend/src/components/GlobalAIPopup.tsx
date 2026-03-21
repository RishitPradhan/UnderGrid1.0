import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Minus, Terminal, Loader2, User, Zap, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import { useSimContext } from "@/context/SimContext";

const API_BASE = "http://localhost:3000";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
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

function parseActions(content: string): ParsedAction[] {
    const regex = /\[ACTION:\s*(\w+)\s*\|\s*TARGET:\s*([^\]|]+)\s*\|\s*MSG:\s*([^\]]+)\]/gi;
    const actions: ParsedAction[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        actions.push({ action: match[1].trim(), target: match[2].trim(), message: match[3].trim(), status: "pending" });
    }
    return actions;
}

function stripActionTags(content: string): string {
    return content.replace(/\[ACTION:\s*\w+\s*\|[^\]]+\]/gi, "").trim();
}

export default function GlobalAIPopup() {
    const { simMiners, simAlerts, simZones } = useSimContext();
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "system",
            content: "**UnderGrid AI** — Quick Access Terminal\n\nLive mine data connected. Ask me anything about miner status, sensor trends, or safety protocols.",
            timestamp: new Date().toISOString(),
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (open && !minimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, open, minimized]);

    // Focus input when opened
    useEffect(() => {
        if (open && !minimized) {
            setTimeout(() => inputRef.current?.focus(), 300);
            setUnreadCount(0);
        }
    }, [open, minimized]);

    const getHistory = useCallback(() => {
        return messages
            .filter(m => m.role === "user" || m.role === "assistant")
            .slice(-8)
            .map(m => ({ role: m.role, content: m.content }));
    }, [messages]);

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
        } catch (err: any) {
            setMessages(prev => {
                const updated = [...prev];
                const msg = { ...updated[msgIndex] };
                const actions = [...(msg.actions || [])];
                actions[actionIndex] = { ...actions[actionIndex], status: "failed", result: err?.response?.data?.message || "Execution failed" };
                msg.actions = actions;
                updated[msgIndex] = msg;
                return updated;
            });
        }
    };

    const sendMessage = async () => {
        const msg = input.trim();
        if (!msg || loading) return;

        const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const placeholder: ChatMessage = { role: "assistant", content: "", timestamp: new Date().toISOString(), streaming: true };
        setMessages(prev => [...prev, placeholder]);

        try {
            const history = getHistory();
            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: msg + "\n\n[COMPACT MODE: Be extremely concise. Short sentences only.]",
                    history,
                    simContext: simMiners.length > 0 ? {
                        miners: simMiners,
                        alerts: simAlerts,
                        zones: simZones,
                    } : undefined,
                }),
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
                                    const last = updated.length - 1;
                                    updated[last] = { ...updated[last], content: fullContent, streaming: true };
                                    return updated;
                                });
                            }
                            if (json.done) {
                                const actions = parseActions(fullContent);
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const last = updated.length - 1;
                                    updated[last] = {
                                        ...updated[last],
                                        content: fullContent,
                                        streaming: false,
                                        timestamp: new Date().toISOString(),
                                        actions: actions.length > 0 ? actions : undefined,
                                    };
                                    return updated;
                                });
                                // Bump unread if popup is minimized/closed
                                if (!open || minimized) setUnreadCount(c => c + 1);
                            }
                        } catch { /* skip */ }
                    }
                }
            }

            // Ensure final state
            setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;
                if (updated[last]?.streaming) {
                    const actions = parseActions(fullContent);
                    updated[last] = {
                        ...updated[last],
                        content: fullContent || "⚠️ No response.",
                        streaming: false,
                        actions: actions.length > 0 ? actions : undefined,
                    };
                }
                return updated;
            });

        } catch (err: any) {
            if (err.name === "AbortError") return;
            setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;
                updated[last] = {
                    role: "assistant",
                    content: `⚠️ **Error:** ${err.message || "AI engine unreachable."}`,
                    timestamp: new Date().toISOString(),
                    streaming: false,
                };
                return updated;
            });
        }

        setLoading(false);
        abortRef.current = null;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleOpen = () => {
        setOpen(true);
        setMinimized(false);
        setUnreadCount(0);
    };

    return (
        <>
            {/* ─── Chat Panel ─── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="popup-panel"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={minimized
                            ? { opacity: 0, scale: 0.92, y: 20 }
                            : { opacity: 1, scale: 1, y: 0 }
                        }
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="fixed bottom-24 right-6 z-[9999] w-[440px] max-h-[580px] flex flex-col rounded-2xl overflow-hidden"
                        style={{
                            background: "rgba(10, 10, 10, 0.92)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid rgba(0, 212, 255, 0.12)",
                            boxShadow: "0 0 40px rgba(0, 212, 255, 0.08), 0 24px 64px rgba(0, 0, 0, 0.7)",
                            display: minimized ? "none" : undefined,
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
                            style={{ background: "rgba(0, 212, 255, 0.04)" }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: "rgba(0, 212, 255, 0.12)", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
                                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-white/90">UnderGrid AI</p>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400/70 font-mono">LIVE DATA CONNECTED</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setMinimized(true)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                                    title="Minimize">
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setOpen(false); abortRef.current?.abort(); }}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/[0.06] transition-all"
                                    title="Close">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
                            <AnimatePresence initial={false}>
                                {messages.map((msg, i) => (
                                    <PopupMessageBubble
                                        key={i}
                                        message={msg}
                                        msgIndex={i}
                                        onExecuteAction={executeAction}
                                    />
                                ))}
                            </AnimatePresence>

                            {loading && !messages[messages.length - 1]?.streaming && (
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(0,212,255,0.08)" }}>
                                        <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                                    </div>
                                    <span className="text-[11px] text-white/25 font-mono">Connecting to AI...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick commands — styled as a grouped bar */}
                        <div className="px-3 pb-2 pt-1 border-t border-white/[0.04]">
                            <p className="text-[9px] text-white/15 font-mono uppercase tracking-widest mb-1.5">Quick Commands</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {["Who is in danger?", "Gas report", "Sensor trends"].map(cmd => (
                                    <button key={cmd} onClick={() => { setInput(cmd); setTimeout(sendMessage, 0); }}
                                        disabled={loading}
                                        className="text-[10px] px-2.5 py-1 rounded-md font-mono border border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-cyan-400 hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] transition-all duration-150 disabled:opacity-30">
                                        {cmd}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="px-3 pb-3">
                            <div className="flex items-end gap-2 rounded-xl px-3 py-2"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask UnderGrid AI..."
                                    rows={1}
                                    disabled={loading}
                                    className="flex-1 bg-transparent text-[12px] text-white/80 placeholder:text-white/20 resize-none outline-none font-mono py-0.5"
                                    style={{ maxHeight: "72px" }}
                                />
                                <button onClick={sendMessage} disabled={loading || !input.trim()}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
                                    style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.2)", color: "#22d3ee" }}>
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── FAB + Minimized restore ─── */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
                {/* Minimized pill */}
                <AnimatePresence>
                    {open && minimized && (
                        <motion.button
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.9 }}
                            onClick={() => setMinimized(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-mono font-medium text-white/70 transition-all"
                            style={{
                                background: "rgba(10, 10, 10, 0.92)",
                                backdropFilter: "blur(16px)",
                                border: "1px solid rgba(0, 212, 255, 0.15)",
                                boxShadow: "0 0 20px rgba(0,212,255,0.08)",
                            }}
                        >
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            UnderGrid AI
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.button
                    onClick={open && !minimized ? () => setMinimized(true) : handleOpen}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                        background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.12))",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(0, 212, 255, 0.25)",
                        boxShadow: "0 0 30px rgba(0, 212, 255, 0.2), 0 8px 32px rgba(0,0,0,0.5)",
                    }}
                >
                    {/* Glow ring */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ border: "1px solid rgba(0,212,255,0.3)" }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                    />
                    {open && !minimized
                        ? <Minus className="w-5 h-5 text-cyan-400" />
                        : <Bot className="w-5 h-5 text-cyan-400" />
                    }
                    {/* Unread badge */}
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                                style={{ background: "#f87171" }}>
                                {unreadCount}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </>
    );
}

/* ─── Action Confirm Card (compact for popup) ─── */
function PopupActionCard({ action, index, msgIndex, onExecute }: {
    action: ParsedAction; index: number; msgIndex: number;
    onExecute: (msgIdx: number, actionIdx: number) => void;
}) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-2 rounded-lg overflow-hidden hazard-stripe">
            <div className="bg-black/80 backdrop-blur-sm m-[2px] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Action Pending</span>
                </div>
                <p className="text-[10px] text-white/50 mb-1 font-mono">
                    <span className="text-amber-400/70">→</span> {action.action} | <span className="text-amber-400/70">{action.target}</span>
                </p>
                <p className="text-[10px] text-white/40 mb-2 font-mono truncate">{action.message}</p>

                {action.status === "pending" && (
                    <button onClick={() => onExecute(msgIndex, index)}
                        className="action-confirm-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold w-full justify-center">
                        <Zap className="w-3 h-3" /> CONFIRM & EXECUTE
                    </button>
                )}
                {action.status === "executing" && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" /> Executing...
                    </div>
                )}
                {action.status === "success" && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono">
                        <CheckCircle className="w-3 h-3" /> {action.result || "Done."}
                    </div>
                )}
                {action.status === "failed" && (
                    <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-mono">
                        <XCircle className="w-3 h-3" /> {action.result || "Failed."}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ─── Message Bubble ─── */
function PopupMessageBubble({ message, msgIndex, onExecuteAction }: {
    message: ChatMessage; msgIndex: number;
    onExecuteAction: (msgIdx: number, actionIdx: number) => void;
}) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const displayContent = message.actions ? stripActionTags(message.content) : message.content;

    return (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
            className={`flex gap-2 min-w-0 ${isUser ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${isSystem ? "bg-amber-400/10 border border-amber-400/20"
                : isUser ? "bg-white/[0.05] border border-white/[0.08]"
                    : "bg-cyan-400/10 border border-cyan-400/20"}`}>
                {isSystem
                    ? <span className="text-[9px] text-amber-400">⚡</span>
                    : isUser
                        ? <User className="w-3 h-3 text-white/40" />
                        : <Bot className="w-3 h-3 text-cyan-400" />}
            </div>

            {/* Bubble — flex-1 + min-w-0 so it never overflows the popup panel */}
            <div className={`flex-1 min-w-0 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`w-full px-3 py-2 rounded-xl text-[12px] leading-relaxed break-words ${isSystem
                    ? "bg-amber-400/5 border border-amber-400/10 text-amber-200/70"
                    : isUser
                        ? "bg-white/[0.05] border border-white/[0.07] text-white/75"
                        : "bg-cyan-400/[0.04] border border-cyan-400/[0.07] text-white/65"}`}>
                    {/* Markdown content — tables use full width and wrap, text wraps naturally */}
                    <div className="prose prose-invert prose-sm max-w-none
                        [&>table]:text-[10px] [&>table]:border-collapse [&>table]:w-full
                        [&>table_td]:px-1.5 [&>table_td]:py-1 [&>table_td]:border [&>table_td]:border-white/10 [&>table_td]:align-top [&>table_td]:break-words
                        [&>table_th]:px-1.5 [&>table_th]:py-1 [&>table_th]:border [&>table_th]:border-white/10 [&>table_th]:text-cyan-400/80 [&>table_th]:font-semibold
                        [&>p]:break-words [&>ul]:break-words [&>ol]:break-words [&>p]:text-[12px] [&>ul]:text-[12px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                        {message.streaming && <span className="inline-block w-1.5 h-3.5 bg-cyan-400/80 ml-0.5 animate-blink-cursor" />}
                    </div>

                    {/* Action cards */}
                    {message.actions?.map((action, idx) => (
                        <PopupActionCard key={idx} action={action} index={idx} msgIndex={msgIndex} onExecute={onExecuteAction} />
                    ))}
                </div>
                <span className="text-[9px] text-white/15 mt-0.5 font-mono px-1">
                    {message.streaming ? <span className="text-cyan-400/30">streaming...</span>
                        : new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </motion.div>
    );
}
