import express from "express";
const router = express.Router();

/*
 * ══════════════════════════════════════════════════════════════
 *  TALCHER COALFIELDS — Evacuation Route Calculator
 *  Uses the actual tunnel network junctions and 4 exit points.
 *  Each miner is routed to their NEAREST exit via A* pathfinding
 *  on the real tunnel graph, avoiding danger zones.
 * ══════════════════════════════════════════════════════════════
 */

// 4 Mine exits (must match frontend EXIT_POINTS)
const EXIT_POINTS = [
    { id: "exit-1", name: "Main Shaft (Pit Head #1)", coords: [20.9580, 85.2000] },
    { id: "exit-2", name: "Belt Conveyor Incline", coords: [20.9320, 85.2000] },
    { id: "exit-3", name: "Emergency Escape Shaft (South)", coords: [20.9320, 85.2240] },
    { id: "exit-4", name: "Ventilation Shaft #2 (NE)", coords: [20.9580, 85.2240] },
];

// All junction points from the tunnel network (intersections of tunnels)
// These are the points where tunnels cross, forming the graph nodes.
const JUNCTIONS = [
    // Main grid junctions (5 levels × 5 E-W positions = 25 nodes)
    [20.9540, 85.2000], [20.9540, 85.2060], [20.9540, 85.2120], [20.9540, 85.2180], [20.9540, 85.2240],
    [20.9500, 85.2000], [20.9500, 85.2060], [20.9500, 85.2120], [20.9500, 85.2180], [20.9500, 85.2240],
    [20.9460, 85.2000], [20.9460, 85.2060], [20.9460, 85.2120], [20.9460, 85.2180], [20.9460, 85.2240],
    [20.9420, 85.2000], [20.9420, 85.2060], [20.9420, 85.2120], [20.9420, 85.2180], [20.9420, 85.2240],
    [20.9380, 85.2000], [20.9380, 85.2060], [20.9380, 85.2120], [20.9380, 85.2180], [20.9380, 85.2240],
    // Haulage road extensions (north/south of grid)
    [20.9580, 85.2000], [20.9580, 85.2120], [20.9580, 85.2240], // North row (exits 1, center, 4)
    [20.9340, 85.2000], [20.9340, 85.2120], [20.9340, 85.2240], // Near-south row
    [20.9320, 85.2000], [20.9320, 85.2120], [20.9320, 85.2240], // South row (exits 2, center, 3)
    // Ventilation drift nodes
    [20.9560, 85.2030], [20.9520, 85.2030], [20.9480, 85.2030], [20.9440, 85.2030], [20.9400, 85.2030], [20.9360, 85.2030],
    [20.9560, 85.2210], [20.9520, 85.2210], [20.9480, 85.2210], [20.9440, 85.2210], [20.9400, 85.2210], [20.9360, 85.2210],
    // Panel heading endpoints
    [20.9484, 85.2036], [20.9470, 85.2020],
    [20.9450, 85.2080], [20.9440, 85.2070],
    [20.9404, 85.2036], [20.9390, 85.2020],
    [20.9450, 85.2210], [20.9440, 85.2230],
    // Old workings spur
    [20.9370, 85.2080], [20.9360, 85.2100],
];

function dist(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function key(point) {
    return `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
}

function isInDangerZone(point, dangerZones) {
    for (const zone of dangerZones) {
        if (!zone.polygon || zone.polygon.length < 3) continue;
        const center = zone.polygon.reduce(
            (acc, p) => [acc[0] + p[0] / zone.polygon.length, acc[1] + p[1] / zone.polygon.length], [0, 0]
        );
        if (dist(point, center) < 0.004) return true;
    }
    return false;
}

// Build adjacency graph from junctions
function buildGraph(dangerZones) {
    const CONNECT_RANGE = 0.0045; // ~450m — connects adjacent grid nodes
    const graph = new Map();

    for (const wp of JUNCTIONS) {
        const k = key(wp);
        if (!graph.has(k)) graph.set(k, []);
        for (const other of JUNCTIONS) {
            if (wp === other) continue;
            const d = dist(wp, other);
            if (d < CONNECT_RANGE) {
                const dangerPenalty = isInDangerZone(other, dangerZones) ? 50 : 0;
                graph.get(k).push({ node: other, cost: d + dangerPenalty });
            }
        }
    }
    return graph;
}

// A* pathfinding from a start point to a specific exit
function findPathToExit(start, exit, graph) {
    // Find nearest junction to the miner's position
    let nearestJunction = JUNCTIONS[0];
    let nearestDist = dist(start, JUNCTIONS[0]);
    for (const wp of JUNCTIONS) {
        const d = dist(start, wp);
        if (d < nearestDist) { nearestDist = d; nearestJunction = wp; }
    }

    const exitCoords = exit.coords;
    const exitKey = key(exitCoords);
    const startKey = key(nearestJunction);

    if (startKey === exitKey) {
        return { path: [start, exitCoords], exit };
    }

    const open = [{ key: startKey, g: 0, f: dist(nearestJunction, exitCoords), path: [start, nearestJunction] }];
    const closed = new Set();

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();

        // Check if we reached the exit (or are very close)
        const currentCoords = current.key.split(",").map(Number);
        if (dist(currentCoords, exitCoords) < 0.002) {
            return { path: [...current.path, exitCoords], exit };
        }

        if (closed.has(current.key)) continue;
        closed.add(current.key);

        const neighbors = graph.get(current.key) || [];
        for (const { node, cost } of neighbors) {
            const nKey = key(node);
            if (closed.has(nKey)) continue;
            const g = current.g + cost;
            const f = g + dist(node, exitCoords);
            open.push({ key: nKey, g, f, path: [...current.path, node] });
        }
    }

    // Fallback: straight line to exit
    return { path: [start, exitCoords], exit };
}

// POST: Calculate evacuation route for each miner to their NEAREST exit
router.post("/routes", (req, res) => {
    const { miners, dangerZones } = req.body;

    if (!miners || !Array.isArray(miners)) {
        return res.status(400).json({ error: "miners array required" });
    }

    const graph = buildGraph(dangerZones || []);

    const routes = miners.map(miner => {
        const minerPos = [miner.lat, miner.lng];

        // Find the nearest exit for this miner
        let bestResult = null;
        let bestDist = Infinity;

        for (const exit of EXIT_POINTS) {
            const result = findPathToExit(minerPos, exit, graph);
            // Calculate total path distance
            let totalDist = 0;
            for (let i = 0; i < result.path.length - 1; i++) {
                totalDist += dist(result.path[i], result.path[i + 1]);
            }
            if (totalDist < bestDist) {
                bestDist = totalDist;
                bestResult = result;
            }
        }

        return {
            minerId: miner.id,
            minerName: miner.name,
            exitName: bestResult.exit.name,
            exitId: bestResult.exit.id,
            path: bestResult.path,
        };
    });

    res.json({
        timestamp: new Date().toISOString(),
        exitPoints: EXIT_POINTS,
        routes,
    });
});

export default router;
