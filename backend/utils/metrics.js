import client from "prom-client";
import express from "express";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

const prometheusMiddleware = (req, res, next) => {
    res.on("finish", () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status: res.statusCode,
        });
    });
    next();
};

const metricsRouter = express.Router();
metricsRouter.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

export { prometheusMiddleware, metricsRouter };
