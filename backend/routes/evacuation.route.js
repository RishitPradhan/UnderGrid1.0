import express from "express";
const router = express.Router();

// Mine exit point
const EXIT_POINT = [20.9345, 85.1595];

// Tunnel network as a graph of waypoints
const WAYPOINTS = [
    [20.9380, 85.2050], [20.9400, 85.2000], [20.9400, 85.1900],
    [20.9380, 85.1800], [20.9360, 85.1700], [20.9345, 85.1595], // EXIT
    [20.9420, 85.2050], [20.9420, 85.2120], [20.9420, 85.2190],
    [20.9420, 85.2230], [20.9440, 85.2120], [20.9460, 85.2100],
    [20.9480, 85.2080], [20.9500, 85.2060], [20.9500, 85.1950],
    [20.9480, 85.1850], [20.9450, 85.1750], [20.9400, 85.1650],
    [20.9460, 85.2150], [20.9520, 85.2200], [20.9550, 85.2150],
    [20.9550, 85.2050], [20.9530, 85.1950], [20.9500, 85.1850],
];

function dist(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function isInDangerZone(point, dangerZones) {
    for (const zone of dangerZones) {
        const center = zone.polygon.reduce((acc, p) => [acc[0] + p[0] / zone.polygon.length, acc[1] + p[1] / zone.polygon.length], [0, 0]);
        const zoneDist = dist(point, center);
        if (zoneDist < 0.003) return true; // within ~300m of zone center
    }
    return false;
}

// Simplified A* pathfinding
function findPath(start, dangerZones) {
    // Find nearest waypoint to start
    let nearest = WAYPOINTS[0];
    let nearestDist = dist(start, WAYPOINTS[0]);
    for (const wp of WAYPOINTS) {
        const d = dist(start, wp);
        if (d < nearestDist) { nearestDist = d; nearest = wp; }
    }

    // Build adjacency graph (connect waypoints within range)
    const CONNECT_RANGE = 0.015;
    const graph = new Map();
    for (const wp of WAYPOINTS) {
        const neighbors = [];
        for (const other of WAYPOINTS) {
            if (wp === other) continue;
            if (dist(wp, other) < CONNECT_RANGE) {
                const cost = isInDangerZone(other, dangerZones) ? 999 : dist(wp, other);
                neighbors.push({ node: other, cost });
            }
        }
        graph.set(wp.join(","), neighbors);
    }

    // A* search
    const exitKey = EXIT_POINT.join(",");
    const startKey = nearest.join(",");
    const open = [{ key: startKey, g: 0, f: dist(nearest, EXIT_POINT), path: [start, nearest] }];
    const closed = new Set();

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();

        if (dist(WAYPOINTS.find(w => w.join(",") === current.key) || EXIT_POINT, EXIT_POINT) < 0.002) {
            return [...current.path, EXIT_POINT];
        }

        if (closed.has(current.key)) continue;
        closed.add(current.key);

        const neighbors = graph.get(current.key) || [];
        for (const { node, cost } of neighbors) {
            const nKey = node.join(",");
            if (closed.has(nKey)) continue;
            const g = current.g + cost;
            const f = g + dist(node, EXIT_POINT);
            open.push({ key: nKey, g, f, path: [...current.path, node] });
        }
    }

    // Fallback: direct line to exit
    return [start, EXIT_POINT];
}

// POST: Calculate evacuation routes for all miners
router.post("/routes", (req, res) => {
    const { miners, dangerZones } = req.body;

    if (!miners || !Array.isArray(miners)) {
        return res.status(400).json({ error: "miners array required" });
    }

    const routes = miners.map(miner => ({
        minerId: miner.id,
        minerName: miner.name,
        path: findPath([miner.lat, miner.lng], dangerZones || []),
    }));

    res.json({
        timestamp: new Date().toISOString(),
        exitPoint: EXIT_POINT,
        routes,
    });
});

export default router;
