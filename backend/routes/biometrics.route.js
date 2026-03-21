import express from "express";
const router = express.Router();

// Simulated miner IDs (matches frontend)
const MINER_IDS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"];

// Persistent vitals state (accumulates fatigue over time)
const vitalsState = {};

function initMinerVitals(id) {
    vitalsState[id] = {
        heartRate: 72 + Math.random() * 10,
        coreTemp: 36.5 + Math.random() * 0.5,
        o2Level: 97 + Math.random() * 2,
        fatigue: 100, // starts full, drains over time
        stressIndex: Math.random() * 20,
    };
}

MINER_IDS.forEach(initMinerVitals);

function tickVitals(id) {
    const v = vitalsState[id];
    if (!v) { initMinerVitals(id); return vitalsState[id]; }

    // Heart rate: normal range 60-100, spikes under stress
    v.heartRate = Math.max(55, Math.min(130, v.heartRate + (Math.random() - 0.48) * 4));

    // Core temp: 36.0 - 39.0
    v.coreTemp = Math.max(36.0, Math.min(39.0, v.coreTemp + (Math.random() - 0.49) * 0.15));

    // O2: 88-100, drops under stress
    v.o2Level = Math.max(88, Math.min(100, v.o2Level + (Math.random() - 0.48) * 0.8));

    // Fatigue drains slowly, resets occasionally
    v.fatigue = Math.max(0, Math.min(100, v.fatigue - (0.08 + Math.random() * 0.15)));
    if (v.fatigue < 5 && Math.random() > 0.95) v.fatigue = 85; // simulated rest break

    // Stress index: composite 0-100
    v.stressIndex = Math.min(100, Math.max(0,
        (130 - v.heartRate < 30 ? 40 : 0) +
        (v.coreTemp > 38 ? 30 : 0) +
        (v.o2Level < 93 ? 30 : 0) +
        (100 - v.fatigue) * 0.3 +
        Math.random() * 5
    ));

    return { ...v };
}

// SSE endpoint: streams vitals for all miners every 1.5s
router.get("/stream", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });

    const send = () => {
        const payload = {};
        MINER_IDS.forEach(id => {
            payload[id] = tickVitals(id);
        });
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    send(); // immediate first push
    const interval = setInterval(send, 1500);

    req.on("close", () => clearInterval(interval));
});

// Single miner vitals snapshot
router.get("/:minerId", (req, res) => {
    const id = req.params.minerId;
    if (!vitalsState[id]) initMinerVitals(id);
    res.json({ minerId: id, vitals: tickVitals(id) });
});

export default router;
