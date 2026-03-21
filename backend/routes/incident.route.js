import express from "express";
import Incident from "../models/incident.model.js";

const router = express.Router();

// GET /incidents — list all incidents (newest first), optional ?limit=N
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const incidents = await Incident.find().sort({ createdAt: -1 }).limit(limit);
        res.json({ success: true, data: incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /incidents/:id/resolve — mark an incident as resolved
router.patch("/:id/resolve", async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { resolved: true, resolvedAt: new Date() },
            { new: true }
        );
        if (!incident) return res.status(404).json({ success: false, message: "Incident not found" });
        res.json({ success: true, data: incident });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
