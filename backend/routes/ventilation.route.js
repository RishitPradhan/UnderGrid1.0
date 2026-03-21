import express from "express";
const router = express.Router();

// Fan state
const fans = [
    { id: "fan-1", name: "Main Trunk Fan", location: [20.9420, 85.2050], active: true, reversed: false, rpm: 1200 },
    { id: "fan-2", name: "Cross-Section A Fan", location: [20.9445, 85.2140], active: true, reversed: false, rpm: 900 },
    { id: "fan-3", name: "Cross-Section B Fan", location: [20.9475, 85.2100], active: false, reversed: false, rpm: 0 },
    { id: "fan-4", name: "Emergency Exhaust", location: [20.9400, 85.2200], active: true, reversed: false, rpm: 1500 },
];

let purgeState = { active: false, tunnelId: null, startTime: null };

// Get all fan states
router.get("/fans", (req, res) => {
    res.json({ fans, purge: purgeState });
});

// Toggle a fan on/off
router.post("/toggle", (req, res) => {
    const { fanId } = req.body;
    const fan = fans.find(f => f.id === fanId);
    if (!fan) return res.status(404).json({ error: "Fan not found" });

    fan.active = !fan.active;
    fan.rpm = fan.active ? (800 + Math.random() * 700) : 0;
    res.json({ success: true, fan });
});

// Reverse a fan's airflow direction
router.post("/reverse", (req, res) => {
    const { fanId } = req.body;
    const fan = fans.find(f => f.id === fanId);
    if (!fan) return res.status(404).json({ error: "Fan not found" });
    if (!fan.active) return res.status(400).json({ error: "Fan must be active to reverse" });

    fan.reversed = !fan.reversed;
    res.json({ success: true, fan });
});

// Trigger a tunnel purge
router.post("/purge", (req, res) => {
    const { tunnelId } = req.body;
    purgeState = { active: true, tunnelId: tunnelId || "main", startTime: Date.now() };

    // Automatically stop purge after 10 seconds
    setTimeout(() => {
        purgeState = { active: false, tunnelId: null, startTime: null };
    }, 10000);

    // Crank all fans to max
    fans.forEach(f => { f.active = true; f.rpm = 1800; });

    res.json({ success: true, purge: purgeState, message: "Purge initiated — all fans at maximum RPM" });
});

export default router;
