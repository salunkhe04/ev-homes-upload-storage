import { Router } from "express";
import {
  getLeaveHistory,
  getLeaveHistoryById,
  createLeaveHistory,
  deleteLeaveHistory,
  createLeaveHistoryFunc,
  compOffExpiry,
  overallCompExpiration,
} from "../../controller/leaveHistory.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const leaveHistoryRouter = Router();
leaveHistoryRouter.get(
  "/leaveHistory",

  authenticateToken,
  getLeaveHistory,
);
leaveHistoryRouter.get(
  "/leaveHistory/:id",
  // authenticateToken,
  getLeaveHistoryById,
);
leaveHistoryRouter.post(
  "/leaveHistory-add",
  authenticateToken,
  createLeaveHistory,
);
leaveHistoryRouter.delete(
  "/leaveHistory-delete/:id",
  authenticateToken,
  deleteLeaveHistory,
);
leaveHistoryRouter.post(
  "/leave-history-add-test",
  authenticateToken,
  async (req, res) => {
    const body = req.body;
    const resp = await createLeaveHistoryFunc({ ...body });
    res.send(resp);
  },
);

leaveHistoryRouter.get(
  "/comp-off-expiry",
  // authenticateToken,
  compOffExpiry,
);


leaveHistoryRouter.get(
  "/overall-comp-off-expiry",
  // authenticateToken,
  overallCompExpiration,
);

export default leaveHistoryRouter;
