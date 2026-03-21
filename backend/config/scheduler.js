import cron from "node-cron";
import droneSimulationService from "../services/droneSimulation.service.js";

export const initScheduler = () => {
    // Run automated patrol every 10 minutes
    cron.schedule("*/10 * * * *", () => {
        console.log("Starting automated drone patrol...");
        droneSimulationService.startPatrol("D03");
        
        // Stop patrol after 5 minutes (simulating mission completion)
        setTimeout(() => {
            console.log("Ending automated drone patrol...");
            droneSimulationService.stopPatrol("D03");
        }, 5 * 60 * 1000);
    });

    console.log("Automated Drone Patrol Scheduler initialized.");
};
