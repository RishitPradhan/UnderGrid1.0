import winston from "winston";
import LokiTransport from "winston-loki";
import morgan from "morgan";

const logger = winston.createLogger({
    transports: [
        new LokiTransport({
            host: process.env.LOKI_URL || "http://localhost:3100",
            labels: { app: "undergrid-ai-backend" },
            json: true,
        }),
        new winston.transports.Console(),
    ],
});

morgan.token("origin", (req) => req.get("origin") || req.get("referer") || "unknown");
morgan.token("time", () => new Date().toISOString());

const format = "[:time] :method :url from :origin -> :status";

const morganMiddleware = morgan(format, {
    stream: { write: (message) => logger.info(message.trim()) },
});

export { logger, morganMiddleware };
