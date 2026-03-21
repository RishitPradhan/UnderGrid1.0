import express from "express";
const router = express.Router();

const LAT_MIN = 20.936, LAT_MAX = 20.960;
const LNG_MIN = 85.195, LNG_MAX = 85.235;

function generateSeismicEvent() {
    return {
        id: `seis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        epicenter: {
            lat: parseFloat((LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN)).toFixed(6)),
            lng: parseFloat((LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN)).toFixed(6)),
        },
        magnitude: parseFloat((0.5 + Math.random() * 3.5).toFixed(2)),
        depth: parseFloat((15 + Math.random() * 85).toFixed(1)), // meters
        type: Math.random() > 0.7 ? "crack" : Math.random() > 0.5 ? "settling" : "vibration",
    };
}

// SSE: stream seismic events every 5-15 seconds
router.get("/stream", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });

    const send = () => {
        const event = generateSeismicEvent();
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Random interval between 5-15s
        const nextDelay = 5000 + Math.random() * 10000;
        timeout = setTimeout(send, nextDelay);
    };

    let timeout = setTimeout(send, 2000); // first event after 2s

    req.on("close", () => clearTimeout(timeout));
});

// GET: single event (for testing)
router.get("/event", (req, res) => {
    res.json(generateSeismicEvent());
});

export default router;
