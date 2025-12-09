import { Router } from "express";
import {
  getAccessory,
  addAccessory,
  getAccessoryById,
  updateAccessory,
  deleteAccessory,
} from "../../controller/accessory.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const accessoryRouter = Router();
accessoryRouter.get("/accessory", authenticateToken, getAccessory);
accessoryRouter.get("/accessory/:id", authenticateToken, getAccessoryById);
accessoryRouter.post("/accessory-add", authenticateToken, addAccessory);
accessoryRouter.post(
  "/accessory-update/:id",
  authenticateToken,
  updateAccessory
);
accessoryRouter.delete("/accessory/:id", authenticateToken, deleteAccessory);

export default accessoryRouter;
