import { Router } from "express";
import {
  addupcomingProjects,
  getupcomingProjects,
  updateupcomingProjects,
  deleteupcomingProject,
} from "../../controller/upcoming_projects.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const upcomingRouter = Router();
upcomingRouter.get(
  "/upcomingProjects",
  //  authenticateToken,
  getupcomingProjects
);

upcomingRouter.post(
  "/upcomingProjects-add",
  authenticateToken,
  addupcomingProjects
);
upcomingRouter.post(
  "/upcomingProjects-update/:id",
  authenticateToken,
  updateupcomingProjects
);

upcomingRouter.delete(
  "/upcomingProjects/:id",
  authenticateToken,
  deleteupcomingProject
);

export default upcomingRouter;
