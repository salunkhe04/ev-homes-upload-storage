import { Router } from "express";
import {
  getAllSessions,
  getSessions,
  logoutAll,
} from "../../controller/userSession.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const sessionRouter = Router();
sessionRouter.get("/sessions", authenticateToken, getSessions);
sessionRouter.post("/sessions-logout-all", authenticateToken, logoutAll);

sessionRouter.get("/sessions-all", authenticateToken, getAllSessions);

export default sessionRouter;
