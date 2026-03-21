import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: String,
  workerId: { type: String, unique: true },
  helmetId: { type: String, unique: true },
  role: String,
  currentLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
    timeStamp: Date,
  },
  lastUpdated: { type: Date, default: Date.now },
  riskZone: Boolean,
});

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
