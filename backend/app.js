import express from "express";
import cors from "cors";
import workerRoutes from "./routes/worker.route.js";
import locationRouter from "./routes/location.route.js";
import incidentRouter from "./routes/incident.route.js";
import reportRouter from "./routes/report.route.js";
import droneRouter from "./routes/drone.route.js";
import chatRouter from "./routes/chat.route.js";
import { morganMiddleware } from "./utils/logger.js";
import { prometheusMiddleware, metricsRouter } from "./utils/metrics.js";

const app = express();

app.use(morganMiddleware);
app.use(prometheusMiddleware);
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/data", express.static("data"));

app.use("/worker", workerRoutes);
app.use("/location", locationRouter);
app.use("/incidents", incidentRouter);
app.use("/report", reportRouter);
app.use("/drone", droneRouter);
app.use("/chat", chatRouter);
app.use(metricsRouter);

export default app;
