import express from "express";
import locationController from "../controllers/location.controller.js";

const router = express.Router();

router.post("/", locationController.updateLocation);
router.get("/:id", locationController.getLocation);

export default router;
