import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema({
    droneId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: {
        x: { type: Number },
        y: { type: Number },
        tunnel: { type: String }
    },
    methaneGasLevel: { type: Number },
    temperature: { type: Number },
    vibration: { type: Number },
    structuralStress: { type: Number },
    crackProbability: { type: Number }
});

const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);
export default SensorReading;
