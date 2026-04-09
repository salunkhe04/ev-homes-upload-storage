import { Router } from "express";
import {
  getSessions,
  logoutAll,
} from "../../controller/userSession.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const sessionRouter = Router();
sessionRouter.get(
  "/sessions",
  authenticateToken,
  getSessions,
);
sessionRouter.get("/sessions-logout-all", authenticateToken, logoutAll);

export default sessionRouter;
