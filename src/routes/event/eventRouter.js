import { Router } from "express";
import {
  addEvent,
  deleteEvent,
  getEvent,
  getEventById,
  updateEvent,
} from "../../controller/event.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const eventRouter = Router();
eventRouter.get("/event", getEvent);

eventRouter.post("/event-add", authenticateToken, addEvent);
eventRouter.get("/event-id/:id", authenticateToken, getEventById);
eventRouter.post("/update-event-id/:id", authenticateToken, updateEvent);
eventRouter.delete("/event-delete/:id", authenticateToken, deleteEvent);

export default eventRouter;
