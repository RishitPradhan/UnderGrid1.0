import droneSimulationService from "../services/droneSimulation.service.js";
import Drone from "../models/drone.model.js";
import SensorReading from "../models/sensorReading.model.js";

export const startPatrol = async (req, res) => {
    try {
        const { droneId } = req.body;
        if (!droneId) return res.status(400).json({ success: false, message: "droneId is required" });
        
        droneSimulationService.startPatrol(droneId);
        res.json({ success: true, message: `Patrol started for drone ${droneId}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const stopPatrol = async (req, res) => {
    try {
        const { droneId } = req.body;
        if (!droneId) return res.status(400).json({ success: false, message: "droneId is required" });
        
        droneSimulationService.stopPatrol(droneId);
        res.json({ success: true, message: `Patrol stopped for drone ${droneId}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getStatus = async (req, res) => {
    try {
        const drones = await Drone.find();
        res.json({ success: true, data: drones });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getLogs = async (req, res) => {
    try {
        const { droneId } = req.params;
        const logs = await SensorReading.find({ droneId }).sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
