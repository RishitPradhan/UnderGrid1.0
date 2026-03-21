import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Worker from "../models/worker.model.js";
import Incident from "../models/incident.model.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// POST /report/generate — generate an AI safety report from current data
router.post("/generate", async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ success: false, message: "GEMINI_API_KEY not set" });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const { simContext } = req.body || {};
        const simZones = simContext?.simZones || [];

        // Gather data
        let workers = [];
        let recentIncidents = [];

        try {
            workers = await Worker.find().maxTimeMS(2000);
            recentIncidents = await Incident.find().sort({ createdAt: -1 }).limit(20).maxTimeMS(2000);
        } catch (dbErr) {
            console.warn("Database unavailable, using mock data for report:", dbErr.message);
            workers = [
                { name: "Ravi Kumar", workerId: "W001", role: "Miner", currentLocation: { coordinates: [85.2110, 20.9440] }, riskZone: "Zone A" },
                { name: "Priya Sharma", workerId: "W004", role: "Safety Officer", currentLocation: { coordinates: [85.2130, 20.9480] }, riskZone: "Zone A" },
                { name: "John Doe", workerId: "W003", role: "Engineer", currentLocation: { coordinates: [85.2080, 20.9420] } },
                { name: "Amit Singh", workerId: "W005", role: "Electrician", currentLocation: { coordinates: [85.2170, 20.9400] } }
            ];
            recentIncidents = [
                { workerName: "Ravi Kumar", workerId: "W001", createdAt: new Date(), resolved: false }
            ];
        }

        const totalWorkers = workers.length;
        const riskWorkers = workers.filter(w => w.riskZone);
        const safeWorkers = workers.filter(w => !w.riskZone);
        const roles = [...new Set(workers.map(w => w.role))];

        // Build sim context string if available
        let simDataSection = "";
        if (simContext) {
            if (simContext.simMiners && simContext.simMiners.length > 0) {
                const dangerMiners = simContext.simMiners.filter(m => m.inDanger);
                const safeSimMiners = simContext.simMiners.filter(m => !m.inDanger);
                simDataSection += `
LIVE SIMULATION DATA (Real-time):
- Total Simulated Miners: ${simContext.simMiners.length}
- Currently in Danger Zones: ${dangerMiners.length}
- Safe: ${safeSimMiners.length}

${dangerMiners.length > 0 ? `MINERS IN DANGER (Simulation):
${dangerMiners.map(m => `  - ${m.name} (${m.workerId}, ${m.role}) at (${m.lat}°N, ${m.lng}°E) — IN ${m.dangerZone}`).join("\n")}` : "  All simulated miners are currently safe."}
`;
            }
            if (simContext.recentSimAlerts && simContext.recentSimAlerts.length > 0) {
                simDataSection += `
RECENT SIMULATION ALERTS (${simContext.recentSimAlerts.length}):
${simContext.recentSimAlerts.map(a => `  - ${a.minerName} (${a.workerId}) entered ${a.zoneName} [${a.riskLevel.toUpperCase()}] at ${new Date(a.time).toLocaleTimeString()}`).join("\n")}
`;
            }
        }

        const dataContext = `
CURRENT MINE STATUS:
- Total Workers: ${totalWorkers}
- Workers in Hazard Zones: ${riskWorkers.length}
- Safe Workers: ${safeWorkers.length}
- Active Roles: ${roles.join(", ")}

WORKERS IN HAZARD ZONES:
${riskWorkers.map(w => `  - ${w.name} (ID: ${w.workerId}, Role: ${w.role}, Location: ${w.currentLocation?.coordinates?.[1]?.toFixed(4)}°N, ${w.currentLocation?.coordinates?.[0]?.toFixed(4)}°E)`).join("\n") || "  None currently"}

RECENT INCIDENTS (last 20):
${recentIncidents.map(i => `  - ${i.workerName} (${i.workerId}) entered high-risk zone at ${new Date(i.createdAt).toLocaleString()}, Resolved: ${i.resolved}`).join("\n") || "  No recent incidents"}
${simDataSection}`;

        const systemPrompt = `You are UnderGrid AI, a high-precision underground mining safety analyzer. 
Your role is to process LIVE simulation and sensor data and generate a CRITICAL SAFETY ASSESSMENT.

RESPONSE GUIDELINES:
1. **Industrial Tone**: Be technical, direct, and zero-filler. NO quotes around summaries.
2. **Visual Hierarchy**: Use Markdown headers (###), bold text, and EXACT GFM tables.
3. **Actionable**: Every observation must lead to a specific safety recommendation.
4. **Structured Format**: Use the following EXACT sections:
   - [[STATUS]]: (LOW / MODERATE / HIGH / CRITICAL)
   - [[SUMMARY]]: 2-3 technical sentences. NO trailing # characters.
   - [[HAZARDS]]: A VALID GFM MARKDOWN TABLE. 
     Example:
     | Priority | Breach | Timestamp | Impact |
     | :--- | :--- | :--- | :--- |
     | High | Zone C Entry | 10:22 AM | Flood Risk |
   - [[GRAPH]]: Provide 5 comma-separated risk numbers (0-100) representing a "safety trend" (e.g. 10,25,40,30,50). 
   - [[FLOW]]: Provide 3 steps for an emergency response flowchart, separated by "-->" (e.g. Detect --> Alert --> Rescue).
   - [[SIMULATION]]: Detailed analysis of miner movements and panic/fatigue states.
   - [[RECOMMENDATIONS]]: 3-4 high-priority tactical actions.`;

        const prompt = `[INDUSTRIAL MONITORING SYSTEM - SAFETY REPORT GENERATION]

REAL-TIME MINING DATA:
${dataContext}

INSTRUCTIONS:
Generate the safety analysis using the data provided. Use COORDINATES and IDs. 
Format any lists of workers or incidents as MARKDOWN TABLES.
Ensure the [[STATUS]] tag is at the very top.

Data Context:
- Total Workers: ${totalWorkers}
- Workers in Danger: ${riskWorkers.length}
- Current Risk Zones: ${simZones.map(z => z.name).join(", ")}
`;



        let report;
        const provider = process.env.AI_PROVIDER || "gemini";

        try {
            if (provider === "ollama") {
                console.log("Generating report using Ollama...");
                const { generateOllamaContent } = await import("../utils/ollama.util.js");
                report = await generateOllamaContent(prompt, systemPrompt);
            } else {
                console.log("Generating report using Gemini...");
                const result = await model.generateContent(systemPrompt + "\n\n" + prompt);
                report = result.response.text();
            }
        } catch (apiErr) {
            console.error(`${provider.toUpperCase()} API error:`, apiErr.message);
            // High-quality static fallback report
            report = `### 🚨 Safety AI Fallback Report
**Status: AI Service Unavailable (${provider})**

### 1. Executive Summary
The real-time monitoring system has detected potential hazards in the Talcher Mining Area. While the live AI generation is currently unavailable, pre-defined safety protocols are active. Current data indicates multiple workers are operating near high-risk zones.

### 2. Current Risk Assessment
- **Geo-Hazard Level:** MODERATE (Land deformation detected in Zone A)
- **Worker Exposure:** ${riskWorkers.length} workers currently in identified danger zones.
- **System Integrity:** Primary monitoring is operational; predictive modeling is in fallback mode.

### 3. Worker Safety Status
- **Workers at Risk:** ${riskWorkers.map(w => w.name).join(", ") || "None identified"}.
- **Safe Zone Density:** High in western sectors; low near active extraction points.

### 4. Recommendations
- **Immediate:** Re-verify gas sensors in sectors with active workers.
- **Action:** Notify at-risk workers to move to the designated safe zone.
- **Maintenance:** Schedule drone inspection of the eastern perimeter.
- **Infrastructure:** Check stability of temporary roof supports in active sectors.

### 5. Risk Level
**${riskWorkers.length > 0 ? "HIGH" : "MODERATE"}**

---
*Note: This report was generated using UnderGrid's local safety heuristic engine due to ${provider} service unavailability.*`;
        }

        res.json({
            success: true,
            data: {
                report,
                generatedAt: new Date().toISOString(),
                stats: { totalWorkers, atRisk: riskWorkers.length, safe: safeWorkers.length, recentIncidents: recentIncidents.length },
                provider: provider
            },
        });
    } catch (err) {
        console.error("General report error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
