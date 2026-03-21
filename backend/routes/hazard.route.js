import express from "express";
const router = express.Router();

// Mining area bounds
const LAT_MIN = 20.935, LAT_MAX = 20.960;
const LNG_MIN = 85.190, LNG_MAX = 85.240;

// Danger zone centers (hotspots for hazard prediction)
const HOTSPOTS = [
    { lat: 20.9445, lng: 85.2140, baseIntensity: 0.8 },  // Zone A - Gas Leak
    { lat: 20.9415, lng: 85.2095, baseIntensity: 0.6 },  // Zone B - Unstable Roof
    { lat: 20.9475, lng: 85.2105, baseIntensity: 0.5 },  // Zone C - Flooding
    { lat: 20.9500, lng: 85.2200, baseIntensity: 0.3 },  // Secondary hotspot
];

function generateHazardGrid() {
    const points = [];
    const GRID_SIZE = 0.0012; // ~120m resolution

    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_SIZE) {
        for (let lng = LNG_MIN; lng <= LNG_MAX; lng += GRID_SIZE) {
            let intensity = 0;

            // Accumulate intensity from nearby hotspots
            for (const hs of HOTSPOTS) {
                const dist = Math.sqrt(Math.pow(lat - hs.lat, 2) + Math.pow(lng - hs.lng, 2));
                const radius = 0.008; // influence radius
                if (dist < radius) {
                    const falloff = 1 - (dist / radius);
                    intensity += hs.baseIntensity * falloff * (0.7 + Math.random() * 0.3);
                }
            }

            // Add ambient noise
            intensity += Math.random() * 0.05;

            // Time-varying pulse
            intensity *= (0.8 + Math.sin(Date.now() / 4000) * 0.2);

            if (intensity > 0.08) {
                points.push({
                    lat: parseFloat(lat.toFixed(6)),
                    lng: parseFloat(lng.toFixed(6)),
                    intensity: parseFloat(Math.min(1, intensity).toFixed(3)),
                });
            }
        }
    }

    return points;
}

// Returns current hazard prediction grid
router.get("/grid", (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        grid: generateHazardGrid(),
    });
});

export default router;
