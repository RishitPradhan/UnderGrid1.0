import mongoose from "mongoose";

const droneLogSchema = new mongoose.Schema({
    droneId: { type: String, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    routeTaken: [{
        x: { type: Number },
        y: { type: Number },
        tunnel: { type: String }
    }],
    hazardCounts: {
        methane: { type: Number, default: 0 },
        vibration: { type: Number, default: 0 },
        stress: { type: Number, default: 0 }
    },
    status: { type: String }
});

const DroneLog = mongoose.model("DroneLog", droneLogSchema);
export default DroneLog;
