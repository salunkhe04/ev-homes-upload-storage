import { Router } from "express";
import {
  getDesignation,
  getDesignationById,
  addDesignation,
  updateDesignation,
  deleteDesignation,
} from "../../controller/designation.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const desRouter = Router();
desRouter.get("/designation", getDesignation);
desRouter.get("/designation/:id", authenticateToken, getDesignationById);
desRouter.post("/designation-add", authenticateToken, addDesignation);
desRouter.post("/designation-update/:id", authenticateToken, updateDesignation);
desRouter.delete("/designation/:id", authenticateToken, deleteDesignation);

export default desRouter;
