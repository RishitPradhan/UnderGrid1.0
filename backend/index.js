import app from "./app.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import locationUpdater from "./utils/locationUpdate.util.js";
import { startHighRiskZoneMonitor } from "./utils/highRiskZone.util.js";
import { createServer } from "http";
import { initSocket } from "./sockets/index.js";
import { initScheduler } from "./config/scheduler.js";
import droneSimulationService from "./services/droneSimulation.service.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected!");
        locationUpdater();
        setInterval(async () => {
            await locationUpdater();
        }, 10000);
        startHighRiskZoneMonitor();
        droneSimulationService.setDbConnected(true);
        initScheduler();
    })
    .catch((err) => {
        console.log("Failed to connect to MongoDB. Error:", err.message);
    });

app.get("/", (req, res) => {
    res.send("undergrid.ai v2 Backend");
});

const server = createServer(app);
const io = initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`undergrid.ai v2 backend listening on port ${PORT}`);
});
