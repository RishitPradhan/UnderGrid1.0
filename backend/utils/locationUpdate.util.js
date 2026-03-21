import axios from "axios";
import Worker from "../models/worker.model.js";

const FASTAPI_URL = process.env.FASTAPI_URL || "https://agentsay-geospacialdata.hf.space";

async function locationUpdater() {
    try {
        const workers = await Worker.find();
        if (!workers || workers.length === 0) return true;

        for (const worker of workers) {
            const response = await axios.get(`${FASTAPI_URL}/get-coordinates`);
            const data = response.data;

            if (data?.coordinates) {
                const { longitude, latitude } = data.coordinates;
                await Worker.findByIdAndUpdate(
                    worker._id,
                    {
                        $set: {
                            currentLocation: {
                                type: "Point",
                                coordinates: [longitude, latitude],
                            },
                            lastUpdated: new Date(),
                        },
                    },
                    { new: true }
                );
            }
        }
        return workers;
    } catch (err) {
        console.error("Error in locationUpdater:", err.message);
        return false;
    }
}

export default locationUpdater;
