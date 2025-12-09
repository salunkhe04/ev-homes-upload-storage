import { Router } from "express";
import {
  addNewTarget,
  getCarryForwardOption,
  getMyTarget,
  useCarryForward,
} from "../../controller/target.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const targetRouter = Router();

targetRouter.get("/get-target/:id", 
  // authenticateToken,
   getMyTarget);
targetRouter.get(
  "/get-carry-forward-opt/:id",
  authenticateToken,
  getCarryForwardOption
);
targetRouter.post("/add-target", authenticateToken, addNewTarget);
targetRouter.post("/use-carry-forward/:id", authenticateToken, useCarryForward);

export default targetRouter;
