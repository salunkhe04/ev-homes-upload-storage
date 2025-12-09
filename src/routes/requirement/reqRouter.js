import { Router } from "express";
import {
  addRequirement,
  getRequirements,
} from "../../controller/requirement.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const reqRouter = Router();

reqRouter.get("/requirements", authenticateToken, getRequirements);
reqRouter.post("/requirement-add", authenticateToken, addRequirement);

export default reqRouter;
