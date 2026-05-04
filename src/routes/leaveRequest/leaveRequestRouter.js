import e, { Router } from "express";
import {
  getLeave,
  addLeave,
  updateLeaveStatus,
  getMyLeave,
  getApplyLeave,
  onRejectOrApproveLeave,
  deleteLeaveRequest,
  multipleRejectApproveLeave,
} from "../../controller/leaveRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import employeeModel from "../../model/employee.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import moment from "moment-timezone";
import shiftInfoModel from "../../model/attendance/shift/employeeShiftInfo.js";
import leaveHistoryModel from "../../model/attendance/leave/leavehistory.model.js";
import { createLeaveHistoryFunc } from "../../controller/leaveHistory.controller.js";
import logger from "../../utils/logger.js";
const leaveRequestRouter = Router();

leaveRequestRouter.get("/get-my-leave/:id", authenticateToken, getMyLeave);
leaveRequestRouter.get("/get-leave", authenticateToken, getLeave);
leaveRequestRouter.get(
  "/get-reporting-leave/:id",
  authenticateToken,
  getApplyLeave,
);
leaveRequestRouter.post("/add-leave", authenticateToken, addLeave);
leaveRequestRouter.post(
  "/update-leave/:id",
  authenticateToken,
  updateLeaveStatus,
);

leaveRequestRouter.post(
  "/leave-requests/:id/:status",
  authenticateToken,
  onRejectOrApproveLeave,
);

leaveRequestRouter.delete(
  "/leave-requests/:id",
  authenticateToken,
  deleteLeaveRequest,
);

leaveRequestRouter.post(
  "/multiple-leave-requests/:status",
  // authenticateToken,
  multipleRejectApproveLeave,
);

leaveRequestRouter.post("/add-annual-leaves", async (req, res) => {
  try {
    const now = moment().tz("Asia/Kolkata");

    const sixMonthsAgo = now.clone().subtract(14, "months").toDate();

    console.log(sixMonthsAgo);
    const employees = await employeeModel.find(
      {
        _id: {
          $nin: [
            "ev154-megha-navale",
            "EV234-rahul-gour",
            "ev300-jighnyasha-bhagat",
          ],
        },
        // _id: empId,
        status: "active",
        $or: [
          // { designation: "desg-senior-closing-manager" },
          // { designation: "desg-floor-manager" },
          // { designation: "desg-site-head" },
          // { designation: "desg-sales-executive" },
          // { designation: "desg-front-desk-executive" },
          // { designation: "desg-data-analyzer" },
          // { designation: "desg-senior-sales-manager" },
          // { designation: "desg-sales-manager" },
          // { designation: "desg-app-developer" },
          // { designation: "desg-video-editor" },
          // { designation: "desg-graphic-designer" },
          // { designation: "desg-house-keeping" },
          // { designation: "desg-web-developer" },
          // { designation: "desg-3d-designer" },
          // { designation: "desg-post-sales-head" },
          { designation: "desg-post-sales-executive" },
        ],

        joiningDate: { $lte: sixMonthsAgo },
      },
      { _id: 1, employeeId: 1, firstName: 1, lastName: 1, joiningDate: 1 },
    );

    if (!employees.length) {
      return errorRes2(res, 401, "No eligible employees");
    }

    try {
      await Promise.all(
        employees.map(async (emp) => {
          try {
            const info = await shiftInfoModel.findOne({ userId: emp?._id });

            await shiftInfoModel.findOneAndUpdate(
              { userId: emp?._id },
              {
                $inc: {
                  paidLeave: 15,
                  casualLeave: 7,
                },
              },
              { upsert: true, new: true },
            );

            await createLeaveHistoryFunc({
              date: now.toDate(),
              description: "Annual Paid Leave Added",
              count: 15,
              userId: emp?._id,
              type: "deposit",
              leaveType: "on-paid-leave",
              deposittype: "auto-generated",
              howManyBefore: info?.paidLeave ?? 0,
            });

            await createLeaveHistoryFunc({
              date: now.toDate(),
              description: "Annual Casual Leave Added",
              count: 7,
              userId: emp._id,
              type: "deposit",
              leaveType: "on-casual-leave",
              deposittype: "auto-generated",
              howManyBefore: info?.casualLeave ?? 0,
            });
          } catch (error) {
            logger.info(error);
          }
        }),
      );
    } catch (error) {
      console.error(error);
    }

    return successRes2(res, 200, "Leaves added successfully", {
      length: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, "Something went wrong");
  }
});

export default leaveRequestRouter;
