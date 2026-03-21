import mongoose from "mongoose";

const droneSchema = new mongoose.Schema({
    droneId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["idle", "patrolling", "returning"], default: "idle" },
    batteryLevel: { type: Number, default: 100 },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    currentTunnel: { type: String, default: "Base" },
    missionRoute: [{
        x: { type: Number },
        y: { type: Number },
        tunnel: { type: String }
    }],
    lastUpdate: { type: Date, default: Date.now }
});

const Drone = mongoose.model("Drone", droneSchema);
export default Drone;
