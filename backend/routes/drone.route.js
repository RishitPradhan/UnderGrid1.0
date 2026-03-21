import express from "express";
import { startPatrol, stopPatrol, getStatus, getLogs } from "../controllers/drone.controller.js";

const router = express.Router();

router.post("/start-patrol", startPatrol);
router.post("/stop-patrol", stopPatrol);
router.get("/status", getStatus);
router.get("/logs/:droneId", getLogs);

export default router;
