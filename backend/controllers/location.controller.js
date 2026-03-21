import Worker from "../models/worker.model.js";

class LocationController {
    async updateLocation(req, res) {
        try {
            const { workerId, helmetId, lat, lng } = req.body;
            const worker = await Worker.findOneAndUpdate(
                { $or: [{ workerId }, { helmetId }] },
                {
                    $set: {
                        currentLocation: {
                            type: "Point",
                            coordinates: [lng, lat],
                            timeStamp: new Date(),
                        },
                        lastUpdated: new Date(),
                    },
                },
                { new: true }
            );
            if (!worker) return res.status(404).json({ message: "Worker not found" });
            res.status(200).json({ message: "Location updated successfully", worker });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getLocation(req, res) {
        try {
            const worker = await Worker.findOne({ workerId: req.params.id });
            if (!worker) return res.status(404).json({ message: "Worker not found" });
            res.json({
                workerId: worker.workerId,
                name: worker.name,
                role: worker.role,
                currentLocation: worker.currentLocation,
                lastUpdated: worker.lastUpdated,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

const locationController = new LocationController();
export default locationController;
