import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
    workerId: String,
    helmetId: String,
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
    },
    zoneId: String,
    riskLevel: String,
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
});

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
