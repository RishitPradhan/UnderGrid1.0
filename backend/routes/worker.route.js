import express from "express";
import workerController from "../controllers/worker.controller.js";

const router = express.Router();

router.post("/", workerController.createWorker);
router.post("/sync", workerController.syncMiners);
router.get("/", workerController.getAllWorkers);
router.get("/:id", workerController.getWorkerById);
router.put("/:id", workerController.updateWorker);
router.delete("/:id", workerController.deleteWorker);

export default router;
