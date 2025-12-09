import { Router } from "express";
import {
  getGeofence,
  // getGeofenceById,
  addGeofence,
  updateGeofence,
  deleteGeofence,
} from "../../controller/geofence.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const geoRouter = Router();

geoRouter.get("/geofence", authenticateToken, getGeofence);

geoRouter.post("/geofence-add", authenticateToken, addGeofence);

geoRouter.post("/geofence-update/:id", authenticateToken, updateGeofence);

geoRouter.delete("/geofence/:id", authenticateToken, deleteGeofence);

export default geoRouter;
