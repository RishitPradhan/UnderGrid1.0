import Drone from "../models/drone.model.js";
import SensorReading from "../models/sensorReading.model.js";
import Alert from "../models/alert.model.js";
import Incident from "../models/incident.model.js";
import { emitUpdate } from "../sockets/index.js";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/predict";

const DEFAULT_ROUTE = [
    { x: 10, y: 10, tunnel: "Main Entry" },
    { x: 30, y: 15, tunnel: "Tunnel A1" },
    { x: 50, y: 20, tunnel: "Tunnel A2" },
    { x: 70, y: 40, tunnel: "Sector B - East" },
    { x: 90, y: 60, tunnel: "Extraction Point 1" },
    { x: 50, y: 80, tunnel: "Tunnel C1" },
    { x: 10, y: 10, tunnel: "Main Entry" }
];

class DroneSimulationService {
    constructor() {
        this.activePatrols = new Map(); // droneId -> intervalId
        this.droneState = new Map(); // droneId -> state
        this.isDbConnected = false;
    }

    setDbConnected(status) {
        this.isDbConnected = status;
    }

    async startPatrol(droneId) {
        if (this.activePatrols.has(droneId)) return;

        let droneData = {
            droneId,
            status: "patrolling",
            missionRoute: DEFAULT_ROUTE,
            position: DEFAULT_ROUTE[0],
            currentTunnel: DEFAULT_ROUTE[0].tunnel,
            batteryLevel: 100
        };

        if (this.isDbConnected) {
            try {
                let drone = await Drone.findOne({ droneId });
                if (!drone) {
                    await Drone.create(droneData);
                } else {
                    Object.assign(drone, droneData);
                    await drone.save();
                }
            } catch (err) { console.error("DB Error in startPatrol:", err.message); }
        }
        
        this.droneState.set(droneId, droneData);
        let routeIndex = 0;
        const intervalId = setInterval(async () => {
            await this.patrolStep(droneId, routeIndex);
            routeIndex = (routeIndex + 1) % DEFAULT_ROUTE.length;
        }, 3000);

        this.activePatrols.set(droneId, intervalId);
        emitUpdate("drone_status_change", { droneId, status: "patrolling" });
    }

    async stopPatrol(droneId) {
        const intervalId = this.activePatrols.get(droneId);
        if (intervalId) {
            clearInterval(intervalId);
            this.activePatrols.delete(droneId);
            this.droneState.delete(droneId);
            if (this.isDbConnected) {
                try {
                    await Drone.findOneAndUpdate({ droneId }, { status: "idle" });
                } catch (err) {}
            }
            emitUpdate("drone_status_change", { droneId, status: "idle" });
        }
    }

    async patrolStep(droneId, routeIndex) {
        let drone = this.droneState.get(droneId);
        if (!drone) return;

        const nextPos = drone.missionRoute[routeIndex];
        drone.position = { x: nextPos.x, y: nextPos.y };
        drone.currentTunnel = nextPos.tunnel;
        drone.batteryLevel -= 0.5;

        if (this.isDbConnected) {
            try {
                await Drone.findOneAndUpdate({ droneId }, drone);
            } catch (err) {}
        }

        const sensors = this.generateSensorData();
        if (this.isDbConnected) {
            try {
                await SensorReading.create({
                    droneId,
                    location: nextPos,
                    ...sensors
                });
            } catch (err) {}
        }

        // Hazard Detection Logic
        await this.checkHazards(drone, sensors);

        // AI Risk Prediction
        this.predictRisk(drone, sensors);

        emitUpdate("drone_update", {
            droneId,
            position: drone.position,
            currentTunnel: drone.currentTunnel,
            batteryLevel: drone.batteryLevel,
            sensors
        });
    }

    generateSensorData() {
        return {
            methaneGasLevel: Number((Math.random() * 10).toFixed(2)),
            temperature: Number((25 + Math.random() * 15).toFixed(2)),
            vibration: Number((Math.random()).toFixed(2)),
            structuralStress: Number((Math.random() * 100).toFixed(2)),
            crackProbability: Number((Math.random()).toFixed(2))
        };
    }

    async checkHazards(drone, sensors) {
        let hazardsFound = [];
        if (sensors.methaneGasLevel > 7) hazardsFound.push("High Methane Level");
        if (sensors.vibration > 0.8) hazardsFound.push("Extreme Vibrations");
        if (sensors.crackProbability > 0.75) hazardsFound.push("Structural Instability");

        for (const hazard of hazardsFound) {
            const alertMsg = `⚠ ${hazard} detected in ${drone.currentTunnel} by Drone ${drone.droneId}`;
            
            if (this.isDbConnected) {
                try {
                    await Alert.create({
                        type: "danger",
                        message: alertMsg,
                        location: drone.currentTunnel,
                        source: `Drone ${drone.droneId}`
                    });

                    await Incident.create({
                        workerName: `Drone ${drone.droneId}`,
                        workerId: drone.droneId,
                        type: hazard.includes("Methane") ? "gas" : "structural",
                        description: alertMsg,
                        location: { type: "Point", coordinates: [drone.position.x, drone.position.y] }
                    });
                } catch (err) {}
            }

            emitUpdate("new_alert", { message: alertMsg, type: "danger" });
        }
    }

    async predictRisk(drone, sensors) {
        try {
            const response = await axios.post(AI_SERVICE_URL, { sensors, tunnel: drone.currentTunnel });
            const riskData = response.data;
            
            if (riskData.collapseRisk > 0.7) {
                const msg = `Critical Collapse Risk predicted in ${riskData.dangerZone}: ${(riskData.collapseRisk * 100).toFixed(1)}%`;
                emitUpdate("ai_risk_warning", { message: msg, risk: riskData.collapseRisk });
            }
        } catch (err) {
            // AI Service may not be up yet
        }
    }
}

export default new DroneSimulationService();
