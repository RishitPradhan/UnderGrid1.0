import mongoose from "mongoose";

const hazardZoneSchema = new mongoose.Schema({
    zoneId: { type: String, unique: true },
    name: String,
    polygon: {
        type: { type: String, enum: ["Polygon"], default: "Polygon" },
        coordinates: [[[Number]]],
    },
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    createdAt: { type: Date, default: Date.now },
});

const HazardZone = mongoose.model("HazardZone", hazardZoneSchema);
export default HazardZone;
