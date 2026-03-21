import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
    workerId: { type: String, required: true },
    workerName: { type: String, default: "Unknown" },
    helmetId: { type: String },
    role: { type: String },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
    },
    riskLevel: { type: String, enum: ["High", "Critical"], default: "High" },
    description: { type: String, default: "Entered high-risk zone" },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

incidentSchema.index({ createdAt: -1 });

const Incident = mongoose.model("Incident", incidentSchema);
export default Incident;
