import { Router } from "express";
import { addVehicle, getVehicle } from "../../controller/vehicle.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const vehicleRouter = Router();

vehicleRouter.get("/vehicle", authenticateToken, getVehicle);
vehicleRouter.post("/vehicle-add", authenticateToken, addVehicle);

export default vehicleRouter;
