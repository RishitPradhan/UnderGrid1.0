import fs from "fs";
import path from "path";
import Worker from "../models/worker.model.js";
import Incident from "../models/incident.model.js";
import { sendSMSForWorkers } from "./smsAlert.util.js";

function haversineDistance(coord1, coord2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function checkWorkersInHighRiskZones() {
    try {
        const geojsonPath = path.resolve("data/synthetic_ps_points.geojson");
        const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf-8"));

        const highRiskPoints = geojson.features.filter(
            (f) => f.properties?.risk === "High" && f.geometry?.type === "Point"
        );

        const workers = await Worker.find();
        const workersInHighRisk = [];
        const workerIdsInHighRisk = [];
        const thresholdMeters = 20;

        for (const worker of workers) {
            if (!worker.currentLocation?.coordinates) continue;
            const workerCoord = worker.currentLocation.coordinates;

            for (const zone of highRiskPoints) {
                const dist = haversineDistance(workerCoord, zone.geometry.coordinates);
                if (dist <= thresholdMeters) {
                    workersInHighRisk.push(worker);
                    workerIdsInHighRisk.push(worker._id.toString());
                    break;
                }
            }
        }

        for (const worker of workers) {
            const wasInRisk = worker.riskZone;
            const isInRisk = workerIdsInHighRisk.includes(worker._id.toString());

            if (worker.riskZone !== isInRisk) {
                await Worker.findByIdAndUpdate(worker._id, { $set: { riskZone: isInRisk } });
            }

            // Save incident when worker ENTERS a risk zone (transition from safe to risk)
            if (!wasInRisk && isInRisk) {
                try {
                    await Incident.create({
                        workerId: worker.workerId,
                        workerName: worker.name,
                        helmetId: worker.helmetId,
                        role: worker.role,
                        location: worker.currentLocation,
                        riskLevel: "High",
                        description: `${worker.name} entered a high-risk zone`,
                    });
                } catch (incErr) {
                    console.error("Failed to save incident:", incErr.message);
                }
            }
        }

        if (workersInHighRisk.length > 0) {
            console.log("Workers in High Risk Zones:", workersInHighRisk.map((w) => w._id));
            workersInHighRisk.forEach((w) => sendSMSForWorkers(w._id));
        } else {
            console.log("No workers in High Risk Zones.");
        }

        return workersInHighRisk;
    } catch (err) {
        console.log("Error in checkWorkersInHighRiskZones:", err.message);
        return [];
    }
}

function startHighRiskZoneMonitor() {
    checkWorkersInHighRiskZones();
    setInterval(checkWorkersInHighRiskZones, 10000);
}

export { checkWorkersInHighRiskZones, startHighRiskZoneMonitor };
