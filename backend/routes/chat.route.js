import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Worker from "../models/worker.model.js";
import Incident from "../models/incident.model.js";
import SensorReading from "../models/sensorReading.model.js";
import { checkWorkersInHighRiskZones } from "../utils/highRiskZone.util.js";
import { sendSMSForWorkers } from "../utils/smsAlert.util.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";
const VISION_MODEL = "llava";

// ─── System prompt for UnderGrid AI ───
const SYSTEM_PROMPT = `You are "UnderGrid", a highly advanced and conversational AI Safety Officer for a deep-crust mining operation. 

### YOUR PERSONALITY
- **Professional yet Personable**: You aren't just a terminal; you're a partner. Use the user's name if known, show empathy, and react naturally.
- **Proactive but not Repetitive**: If you've already mentioned a safety hazard in the conversation history, don't repeat the exact same alert unless the situation has worsened or the user asks for an update.
- **Industrial Expertise**: You know your way around Methane levels, InSAR telemetry, and structural engineering. Use this knowledge to explain *why* things are happening.

### OPERATIONAL GUIDELINES
1. **The Greeting**: If the user says hello, respond like a person. Give a quick "All systems nominal" or "We have some activity in Zone B to keep an eye on" instead of a giant data table.
2. **Contextual Intelligence**: Look at the LIVE MINE DATA provided. If someone is in danger, mention it, but weave it into the conversation. 
   - *Bad*: "WARNING: Miner Ravi is in Zone A. Here is a table..."
   - *Good*: "Hey there. I'm keeping an eye on things. Ravi is actually getting a bit close to the gas leak in Zone A, so I'm monitoring his vitals closely. Anything you need help with?"
3. **Data on Demand**: Only show full markdown tables if the user asks for "status", "who's where", "sensor report", or "details". 

### FORMATTING RULES
1. **Markdown**: Use bolding for emphasis, bullet points for lists, and tables for data-heavy sections.
2. **Action Tags**: Use [ACTION: SEND_SMS | TARGET: <id> | MSG: <text>] ONLY when the user explicitly asks you to alert someone or take action.
3. **Tone**: Be helpful, calm, and technically accurate. Avoid being a "bot" that just spits out data.

### CURRENT CAPABILITIES
- You can see real-time miner locations and active sensor trends.
- You can trigger SMS alerts and log incidents.
- You can analyze uploaded tunnel imagery for structural cracks.

Remember the CONVERSATION HISTORY. If you just answered a question, don't repeat the same intro. Keep the flow natural.`;

// ─── Hazard zones (same as simulation) ───
const HAZARD_ZONES = [
    { name: "Zone A - Gas Leak", center: [20.9440, 85.2110], radius: 200, risk: "HIGH", type: "Methane leak detected" },
    { name: "Zone B - Structural", center: [20.9480, 85.2130], radius: 150, risk: "CRITICAL", type: "Structural instability" },
    { name: "Zone C - Flood Risk", center: [20.9420, 85.2080], radius: 180, risk: "MODERATE", type: "Water seepage" },
];

// ─── Haversine distance (meters) ───
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Fetch REAL sensor data with TREND analysis ───
async function getRealSensorData() {
    try {
        // Fetch readings from last 15 minutes for trend calculation
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        const readings = await SensorReading.find({ timestamp: { $gte: fifteenMinAgo } })
            .sort({ timestamp: -1 }).limit(30).maxTimeMS(3000);

        if (readings.length >= 2) {
            // Split into recent (last 5) and older (rest) for trend
            const recentReadings = readings.slice(0, Math.min(5, readings.length));
            const olderReadings = readings.slice(Math.min(5, readings.length));

            const avgRecent = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
            const avgOlder = (arr, key) => arr.length > 0 ? arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length : null;

            const recentMethane = avgRecent(recentReadings, "methaneGasLevel");
            const recentTemp = avgRecent(recentReadings, "temperature");
            const recentVibration = avgRecent(recentReadings, "vibration");
            const recentStress = avgRecent(recentReadings, "structuralStress");
            const recentCrack = avgRecent(recentReadings, "crackProbability");

            const olderMethane = avgOlder(olderReadings, "methaneGasLevel");
            const olderTemp = avgOlder(olderReadings, "temperature");
            const olderVibration = avgOlder(olderReadings, "vibration");

            const trendIcon = (recent, older) => {
                if (older === null) return "→";
                const diff = recent - older;
                if (diff > 0.1) return "↑ RISING";
                if (diff < -0.1) return "↓ FALLING";
                return "→ STABLE";
            };

            const trendDelta = (recent, older) => {
                if (older === null) return "";
                const diff = recent - older;
                return ` (${diff >= 0 ? "+" : ""}${diff.toFixed(2)} in last 15min)`;
            };

            return {
                methaneLevel: `${recentMethane.toFixed(2)} %LEL`,
                methaneTrend: `${trendIcon(recentMethane, olderMethane)}${trendDelta(recentMethane, olderMethane)}`,
                temperature: `${recentTemp.toFixed(1)} °C`,
                temperatureTrend: `${trendIcon(recentTemp, olderTemp)}${trendDelta(recentTemp, olderTemp)}`,
                vibration: `${recentVibration.toFixed(2)} mm/s`,
                vibrationTrend: `${trendIcon(recentVibration, olderVibration)}${trendDelta(recentVibration, olderVibration)}`,
                structuralStress: `${recentStress.toFixed(2)} MPa`,
                crackProbability: `${recentCrack.toFixed(2)} %`,
                source: "LIVE DRONE SENSORS (with trend)",
                hasTrend: true,
            };
        }

        if (readings.length > 0) {
            const avg = {
                methaneLevel: (readings.reduce((s, r) => s + (r.methaneGasLevel || 0), 0) / readings.length).toFixed(2) + " %LEL",
                temperature: (readings.reduce((s, r) => s + (r.temperature || 0), 0) / readings.length).toFixed(1) + " °C",
                vibration: (readings.reduce((s, r) => s + (r.vibration || 0), 0) / readings.length).toFixed(2) + " mm/s",
                structuralStress: (readings.reduce((s, r) => s + (r.structuralStress || 0), 0) / readings.length).toFixed(2) + " MPa",
                crackProbability: (readings.reduce((s, r) => s + (r.crackProbability || 0), 0) / readings.length).toFixed(2) + " %",
                source: "LIVE DRONE SENSORS",
                hasTrend: false,
            };
            return avg;
        }
    } catch { /* fall through to simulated */ }

    // Fallback: simulated readings with fake trends
    return {
        methaneLevel: (Math.random() * 5).toFixed(2) + " %LEL",
        methaneTrend: "→ STABLE (simulated)",
        temperature: (25 + Math.random() * 15).toFixed(1) + " °C",
        temperatureTrend: "→ STABLE (simulated)",
        vibration: (Math.random() * 10).toFixed(2) + " mm/s",
        vibrationTrend: "→ STABLE (simulated)",
        humidity: (40 + Math.random() * 40).toFixed(1) + " %",
        oxygenLevel: (19 + Math.random() * 2).toFixed(1) + " %",
        coLevel: (Math.random() * 50).toFixed(1) + " ppm",
        source: "SIMULATED (no live drone data)",
        hasTrend: true,
    };
}

// ─── Build live context from DB ───
async function buildLiveContext() {
    let workers = [];
    let incidents = [];

    try {
        workers = await Worker.find().maxTimeMS(2000);
        incidents = await Incident.find().sort({ createdAt: -1 }).limit(10).maxTimeMS(2000);
    } catch {
        workers = [
            { name: "Ravi Kumar", workerId: "W001", role: "Miner", currentLocation: { coordinates: [85.2110, 20.9440] }, riskZone: false },
            { name: "Priya Sharma", workerId: "W004", role: "Safety Officer", currentLocation: { coordinates: [85.2130, 20.9480] }, riskZone: false },
            { name: "John Doe", workerId: "W003", role: "Engineer", currentLocation: { coordinates: [85.2080, 20.9420] }, riskZone: false },
            { name: "Amit Singh", workerId: "W005", role: "Electrician", currentLocation: { coordinates: [85.2170, 20.9400] }, riskZone: false },
        ];
        incidents = [];
    }

    try { await checkWorkersInHighRiskZones(); } catch { /* best effort */ }

    const minerStatuses = workers.map((w) => {
        const lat = w.currentLocation?.coordinates?.[1] || 0;
        const lon = w.currentLocation?.coordinates?.[0] || 0;
        let status = w.riskZone ? "WARNING" : "SAFE";
        let nearestZone = null;
        let minDist = Infinity;

        for (const zone of HAZARD_ZONES) {
            const dist = haversineDistance(lat, lon, zone.center[0], zone.center[1]);
            if (dist < minDist) { minDist = dist; nearestZone = zone.name; }
            if (dist < zone.radius) { status = zone.risk === "CRITICAL" ? "CRITICAL" : "WARNING"; }
        }

        return { id: w.workerId, name: w.name, role: w.role, lat: lat.toFixed(4), lon: lon.toFixed(4), status, nearestZone, distToZone: Math.round(minDist) };
    });

    const sensors = await getRealSensorData();

    // Build sensor block with trends if available
    let sensorBlock;
    if (sensors.hasTrend && sensors.methaneTrend) {
        sensorBlock = `SENSOR READINGS (${sensors.source}):
  Methane: ${sensors.methaneLevel} — ${sensors.methaneTrend}
  Temperature: ${sensors.temperature} — ${sensors.temperatureTrend}
  Vibration: ${sensors.vibration} — ${sensors.vibrationTrend}
  ${sensors.structuralStress ? `Structural Stress: ${sensors.structuralStress}` : ""}
  ${sensors.crackProbability ? `Crack Probability: ${sensors.crackProbability}` : ""}
  ${sensors.humidity ? `Humidity: ${sensors.humidity}` : ""}
  ${sensors.oxygenLevel ? `Oxygen: ${sensors.oxygenLevel}` : ""}
  ${sensors.coLevel ? `CO Level: ${sensors.coLevel}` : ""}`;
    } else {
        sensorBlock = `SENSOR READINGS (${sensors.source}):
  Methane: ${sensors.methaneLevel}
  Temperature: ${sensors.temperature}
  Vibration: ${sensors.vibration}
  ${sensors.structuralStress ? `Structural Stress: ${sensors.structuralStress}` : `Humidity: ${sensors.humidity}`}
  ${sensors.crackProbability ? `Crack Probability: ${sensors.crackProbability}` : `Oxygen: ${sensors.oxygenLevel}`}
  ${sensors.coLevel ? `CO Level: ${sensors.coLevel}` : ""}`;
    }

    return `
=== LIVE MINE DATA (${new Date().toLocaleString()}) ===

ACTIVE MINERS (${minerStatuses.length}):
${minerStatuses.map((m) => `  ${m.id} | ${m.name} | ${m.role} | (${m.lat}, ${m.lon}) | ${m.status} | Nearest: ${m.nearestZone} (${m.distToZone}m)`).join("\n")}

HAZARD ZONES:
${HAZARD_ZONES.map((z) => `  ${z.name} | Center: (${z.center[0]}, ${z.center[1]}) | Radius: ${z.radius}m | Risk: ${z.risk} | ${z.type}`).join("\n")}

${sensorBlock}

RECENT INCIDENTS (${incidents.length}):
${incidents.length > 0 ? incidents.map((i) => `  ${i.workerName} (${i.workerId}) — ${new Date(i.createdAt).toLocaleString()} — Resolved: ${i.resolved}`).join("\n") : "  No recent incidents"}
===
`;
}

// ─── Build conversation history string ───
function buildHistoryPrompt(history) {
    if (!history || history.length === 0) return "";
    const lines = history.slice(-10).map((msg) => {
        const role = msg.role === "user" ? "USER" : "UNDERGRID AI";
        return `${role}: ${msg.content}`;
    });
    return `\n--- CONVERSATION HISTORY ---\n${lines.join("\n")}\n--- END HISTORY ---\n`;
}

// ─── POST /chat — streaming text chat ───
router.post("/", async (req, res) => {
    try {
        const { message, history = [], simContext } = req.body;
        if (!message) return res.status(400).json({ success: false, message: "Message is required" });

        const liveContext = await buildLiveContext();
        const historyBlock = buildHistoryPrompt(history);

        // Build simulation overlay if frontend sends it
        let simBlock = "";
        if (simContext) {
            const { miners, alerts, zones } = simContext;
            if (miners && miners.length > 0) {
                const dangerMiners = miners.filter(m => m.inDanger);
                const safeMiners = miners.filter(m => !m.inDanger);
                simBlock += `\n=== LIVE SIMULATION DATA (from frontend, most current) ===\n`;
                simBlock += `Simulation Miners: ${miners.length} total | ${safeMiners.length} safe | ${dangerMiners.length} in danger\n`;
                if (dangerMiners.length > 0) {
                    simBlock += `⚠️ MINERS IN DANGER:\n`;
                    dangerMiners.forEach(m => {
                        simBlock += `  - ${m.name} (${m.workerId}, ${m.role}) at (${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°E) — IN ${m.dangerZone} — State: ${m.state.toUpperCase()}\n`;
                    });
                }
                simBlock += `SAFE MINERS:\n`;
                safeMiners.forEach(m => {
                    simBlock += `  - ${m.name} (${m.workerId}, ${m.role}) at (${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°E) — State: ${m.state.toUpperCase()}\n`;
                });
            }
            if (alerts && alerts.length > 0) {
                simBlock += `\nRECENT SIMULATION ALERTS (${alerts.length}):\n`;
                alerts.slice(0, 10).forEach(a => {
                    simBlock += `  - ${a.minerName} (${a.workerId}) entered ${a.zoneName} [${a.riskLevel.toUpperCase()}] at ${new Date(a.time).toLocaleTimeString()}\n`;
                });
            }
            if (zones && zones.length > 0) {
                simBlock += `\nACTIVE DANGER ZONES:\n`;
                zones.forEach(z => {
                    simBlock += `  - ${z.name}: ${z.riskLevel.toUpperCase()} Risk\n`;
                });
            }
            simBlock += `=== END SIMULATION DATA ===\n`;
        }

        const fullPrompt = `${SYSTEM_PROMPT}

${simBlock ? `${simBlock}\n⚡ IMPORTANT: The LIVE SIMULATION DATA above is the GROUND TRUTH. IGNORE any conflicting location or danger information from the database context below.\n` : ""}
${liveContext}
${historyBlock}
USER QUERY: ${message}

${simBlock ? "CRITICAL: Use ONLY the LIVE SIMULATION DATA for who is in danger and miner locations. Do NOT mention Ravi Kumar or any miner as being near a zone unless the simulation data explicitly shows them there." : ""}
Respond conversationally as UnderGrid AI.`;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const provider = process.env.AI_PROVIDER || "ollama";

        if (provider === "gemini") {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GEMINI_API_KEY not set");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const result = await model.generateContentStream(fullPrompt);
            for await (const chunk of result.stream) {
                const text = chunk.text();
                res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
            }
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            return res.end();
        }

        const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: fullPrompt,
            stream: true,
            options: { temperature: 0.4, num_predict: 2048 },
        }, { responseType: "stream", timeout: 120000 });

        response.data.on("data", (chunk) => {
            try {
                const lines = chunk.toString().split("\n").filter(Boolean);
                for (const line of lines) {
                    const parsed = JSON.parse(line);
                    if (parsed.response) { res.write(`data: ${JSON.stringify({ token: parsed.response })}\n\n`); }
                    if (parsed.done) { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); }
                }
            } catch { /* skip */ }
        });

        response.data.on("end", () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
        response.data.on("error", (err) => {
            console.error("Stream error:", err.message);
            res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`); res.end();
        });

    } catch (err) {
        console.error("Chat route error:", err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "AI engine unreachable. Ensure Ollama is running." });
        } else {
            res.write(`data: ${JSON.stringify({ error: "AI engine error" })}\n\n`); res.end();
        }
    }
});

// ─── POST /chat/execute — Execute AI-requested actions ───
router.post("/execute", async (req, res) => {
    try {
        const { action, target, message } = req.body;
        if (!action || !target) {
            return res.status(400).json({ success: false, message: "Action and target are required" });
        }

        if (action === "SEND_SMS") {
            // Find worker(s) to alert
            let workerIds = [];

            if (target.startsWith("ALL_ZONE_")) {
                // Find all workers in the specified zone
                const zoneName = target.replace("ALL_ZONE_", "Zone ");
                const workers = await Worker.find().maxTimeMS(2000);
                for (const w of workers) {
                    const lat = w.currentLocation?.coordinates?.[1] || 0;
                    const lon = w.currentLocation?.coordinates?.[0] || 0;
                    for (const zone of HAZARD_ZONES) {
                        if (zone.name.includes(zoneName)) {
                            const dist = haversineDistance(lat, lon, zone.center[0], zone.center[1]);
                            if (dist < zone.radius * 2) {
                                workerIds.push(w._id);
                            }
                        }
                    }
                }
            } else {
                // Find specific worker by workerId
                const worker = await Worker.findOne({ workerId: target }).maxTimeMS(2000);
                if (worker) {
                    workerIds.push(worker._id);
                } else {
                    // Try by name (fuzzy)
                    const worker = await Worker.findOne({ name: { $regex: target, $options: "i" } }).maxTimeMS(2000);
                    if (worker) workerIds.push(worker._id);
                }
            }

            if (workerIds.length === 0) {
                return res.json({
                    success: false,
                    message: `No workers found matching target: ${target}`,
                });
            }

            // Execute SMS
            await sendSMSForWorkers(workerIds);

            // Also create an incident record
            for (const id of workerIds) {
                try {
                    const w = await Worker.findById(id);
                    if (w) {
                        await Incident.create({
                            workerId: w.workerId,
                            workerName: w.name,
                            helmetId: w.helmetId,
                            role: w.role,
                            location: w.currentLocation,
                            riskLevel: "Critical",
                            description: `AI-initiated SMS alert: ${message || "Emergency notification"}`,
                        });
                    }
                } catch { /* best effort incident logging */ }
            }

            return res.json({
                success: true,
                message: `SMS alert dispatched to ${workerIds.length} worker(s). Incident logged.`,
                data: { targetCount: workerIds.length, action, target },
            });
        }

        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });

    } catch (err) {
        console.error("Execute route error:", err.message);
        res.status(500).json({ success: false, message: "Failed to execute action: " + err.message });
    }
});

// ─── POST /chat/vision — image analysis with llava + correlated sensor data ───
router.post("/vision", async (req, res) => {
    try {
        const { message, image } = req.body;
        if (!image) return res.status(400).json({ success: false, message: "Image (base64) is required" });

        const liveContext = await buildLiveContext();

        const visionPrompt = `${SYSTEM_PROMPT}

${liveContext}

You are analyzing an image from the underground mine tunnel camera system.
The LIVE SENSOR DATA above is from the same time period as this image. Cross-reference what you see with the sensor readings.

Analyze this image for:
1. Safety hazards (cracks, missing helmets, smoke, water, structural damage)
2. Equipment condition
3. Visibility conditions
4. Any safety violations
5. CORRELATION: Compare what you see with the current sensor readings and TRENDS.

USER MESSAGE: ${message || "Analyze this image for safety concerns."}

Provide a structured safety analysis with sensor correlation and trend awareness.`;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
            model: VISION_MODEL,
            prompt: visionPrompt,
            images: [image],
            stream: true,
            options: { temperature: 0.3, num_predict: 2048 },
        }, { responseType: "stream", timeout: 180000 });

        response.data.on("data", (chunk) => {
            try {
                const lines = chunk.toString().split("\n").filter(Boolean);
                for (const line of lines) {
                    const parsed = JSON.parse(line);
                    if (parsed.response) { res.write(`data: ${JSON.stringify({ token: parsed.response })}\n\n`); }
                    if (parsed.done) { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); }
                }
            } catch { /* skip */ }
        });

        response.data.on("end", () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
        response.data.on("error", (err) => {
            console.error("Vision stream error:", err.message);
            res.write(`data: ${JSON.stringify({ error: "Vision stream interrupted" })}\n\n`); res.end();
        });

    } catch (err) {
        console.error("Vision route error:", err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Vision model unreachable. Ensure llava is pulled in Ollama." });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Vision engine error" })}\n\n`); res.end();
        }
    }
});

// ─── GET /chat/alerts — proactive monitoring with structural hazards ───
router.get("/alerts", async (req, res) => {
    try {
        const workers = await Worker.find().maxTimeMS(2000);
        const criticalMiners = [];

        for (const w of workers) {
            const lat = w.currentLocation?.coordinates?.[1] || 0;
            const lon = w.currentLocation?.coordinates?.[0] || 0;

            for (const zone of HAZARD_ZONES) {
                const dist = haversineDistance(lat, lon, zone.center[0], zone.center[1]);
                if (dist < zone.radius) {
                    criticalMiners.push({
                        workerId: w.workerId, name: w.name,
                        zone: zone.name, risk: zone.risk, type: zone.type,
                        distance: Math.round(dist),
                    });
                    break;
                }
            }
        }

        // Check for structural hazards from recent sensor readings
        const structuralHazards = [];
        try {
            const recentSensors = await SensorReading.find({
                crackProbability: { $gt: 75 },
                timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
            }).sort({ timestamp: -1 }).limit(5).maxTimeMS(2000);

            for (const s of recentSensors) {
                structuralHazards.push({
                    droneId: s.droneId,
                    tunnel: s.location?.tunnel || "Unknown",
                    crackProbability: s.crackProbability,
                    structuralStress: s.structuralStress,
                    timestamp: s.timestamp,
                });
            }
        } catch { /* best effort */ }

        // Recent unresolved incidents
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentIncidents = await Incident.find({
            createdAt: { $gte: fiveMinAgo }, resolved: false,
        }).sort({ createdAt: -1 }).limit(5).maxTimeMS(2000);

        res.json({
            success: true,
            data: {
                criticalMiners,
                structuralHazards,
                recentIncidents: recentIncidents.map(i => ({
                    workerId: i.workerId, workerName: i.workerName,
                    riskLevel: i.riskLevel, description: i.description, time: i.createdAt,
                })),
                timestamp: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error("Alert polling error:", err.message);
        res.json({ success: true, data: { criticalMiners: [], structuralHazards: [], recentIncidents: [], timestamp: new Date().toISOString() } });
    }
});

// ─── GET /chat/status — check AI readiness ───
router.get("/status", async (req, res) => {
    try {
        const tagsRes = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
        const models = tagsRes.data?.models || [];
        const chatModel = models.find((m) => m.name.startsWith(OLLAMA_MODEL));
        const visionModel = models.find((m) => m.name.startsWith(VISION_MODEL));

        res.json({
            success: true,
            data: {
                ollamaOnline: true,
                chatModel: chatModel ? { name: chatModel.name, ready: true } : { name: OLLAMA_MODEL, ready: false },
                visionModel: visionModel ? { name: visionModel.name, ready: true } : { name: VISION_MODEL, ready: false },
            },
        });
    } catch {
        res.json({
            success: false,
            data: { ollamaOnline: false, chatModel: { name: OLLAMA_MODEL, ready: false }, visionModel: { name: VISION_MODEL, ready: false } },
        });
    }
});

export default router;
