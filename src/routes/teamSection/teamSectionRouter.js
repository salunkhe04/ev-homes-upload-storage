import { Router } from "express";
import {
  addTeamSection,
  getTeamSectionById,
  getTeamSections,
} from "../../controller/teamSection.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const teamSectionRouter = Router();

teamSectionRouter.get("/team-sections", authenticateToken, getTeamSections);
teamSectionRouter.get(
  "/team-section-by-id/:id",
  authenticateToken,
  getTeamSectionById
);
teamSectionRouter.post("/team-section-add", authenticateToken, addTeamSection);

export default teamSectionRouter;
