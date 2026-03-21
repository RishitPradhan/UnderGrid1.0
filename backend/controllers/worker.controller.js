import Worker from "../models/worker.model.js";

class WorkerController {
    async createWorker(req, res) {
        try {
            const { name, workerId, helmetId, role } = req.body;
            const worker = new Worker({ name, workerId, helmetId, role });
            await worker.save();
            res.status(201).json({ success: true, data: worker });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAllWorkers(req, res) {
        try {
            const workers = await Worker.find();
            res.status(200).json({ success: true, data: workers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getWorkerById(req, res) {
        try {
            const worker = await Worker.findById(req.params.id);
            if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
            res.status(200).json({ success: true, data: worker });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateWorker(req, res) {
        try {
            const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
            res.status(200).json({ success: true, data: worker });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteWorker(req, res) {
        try {
            const worker = await Worker.findByIdAndDelete(req.params.id);
            if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
            res.status(200).json({ success: true, message: "Worker removed successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async syncMiners(req, res) {
        try {
            const { miners } = req.body;
            if (!miners || !Array.isArray(miners)) {
                return res.status(400).json({ success: false, message: "Miners array required" });
            }

            const ops = miners.map(m => ({
                updateOne: {
                    filter: { workerId: m.workerId },
                    update: {
                        $set: {
                            currentLocation: { type: "Point", coordinates: [m.lng, m.lat] },
                            riskZone: m.inDanger
                        }
                    },
                    upsert: false
                }
            }));

            await Worker.bulkWrite(ops);
            res.status(200).json({ success: true, message: "Sync successful" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const workerController = new WorkerController();
export default workerController;
