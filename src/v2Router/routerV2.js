import { Router } from "express";
import leadRouterV2 from "./leadRouter.js";
import permissionRouter from "./permissionRouter.js";
import visitRouterV2 from "./siteVisitRouter.js";
import weekoffModel from "../model/attendance/weekoff/weekoff.model.js";
import { errorRes, successRes } from "../model/response.js";
import leaveRequestModel from "../model/attendance/leave/leaveRequest.model.js";
import regularizationModel from "../model/regularization.model.js";
import reimbursementModel from "../model/reimbursement.model.js";
import CpOnBoardingModel from "../model/cp_onboarding.model.js";
import cpModel from "../model/channelPartner.model.js";
import assetRequestModel from "../model/assetRequest.model.js";
import eligibilityModel from "../model/eligibilityRequest.model.js";
import shiftPlannerModel from "../model/attendance/shift/shiftPlannerRequest.model.js";
import empDocReqModel from "../model/employeeDocumentRequest.model.js";
import approvalStepModel from "../model/approvalStep.model.js";
import employeeModel from "../model/employee.model.js";
import callRouter from "./callRouter.js";
const routerV2 = Router();
routerV2.use(leadRouterV2);
routerV2.use(permissionRouter);
routerV2.use(visitRouterV2);
routerV2.use(callRouter);

routerV2.get("/approval-pending-counts-dashboard/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.send(errorRes(400, "Missing id"));
  }

  const allCounts = {
    totalItems: 0,

    leaveRequests: 0,
    cpOnboarding: 0,
    reimbursement: 0,
    assetRequest: 0,
    eligibility: 0,
    document: 0,

    attendance: 0,
    weekOff: 0,
    regularizations: 0,
    shiftRequest: 0,
  };

  try {
    const adminData = await employeeModel
      .findById(id)
      .populate({ path: "designation" });

    if (!adminData) {
      return res.send(errorRes(404, "Admin not found"));
    }

    const allowedDesignations = ["desg-site-head", "desg-app-developer"];
    const isAllowedForCPDoc = allowedDesignations.includes(
      adminData.designation._id
    );

    const [
      weekOffCount,
      leaveRequestCount,
      regularizationCount,
      shiftRequestCount,
      cpOnboardingCount,
      reimbursementCount,
      assetRequestCount,
      eligibilityCount,
      documentCount,
    ] = await Promise.all([
      weekoffModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        weekoffStatus: { $eq: "pending" },
      }),

      leaveRequestModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        leaveStatus: { $eq: "pending" },
      }),

      regularizationModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        regularizationStatus: { $eq: "pending" },
      }),

      shiftPlannerModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        requestStatus: { $eq: "pending" },
      }),

      // cpOnboarding not filtered — depends on your business logic
      cpModel.countDocuments({ onBoarding: "under-review" }),

      reimbursementModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        reimbursementStatus: { $eq: "pending" },
      }),

      assetRequestModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        assetRequestStatus: { $eq: "pending" },
      }),

      eligibilityModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        status: { $eq: "under-review" },
      }),

      empDocReqModel.countDocuments({
        approvalSteps: {
          $elemMatch: {
            adminId: id,
            status: "pending",
          },
        },
        docReqStatus: { $eq: "pending" },
      }),
    ]);

    // Fill counts
    allCounts.weekOff = weekOffCount;
    allCounts.regularizations = regularizationCount;
    allCounts.shiftRequest = shiftRequestCount;

    allCounts.leaveRequests = leaveRequestCount;
    // allCounts.cpOnboarding = cpOnboardingCount;
    allCounts.reimbursement = reimbursementCount;
    allCounts.assetRequest = assetRequestCount;
    // allCounts.eligibility = eligibilityCount;
    // allCounts.document = documentCount;

    if (isAllowedForCPDoc) {
      allCounts.cpOnboarding = cpOnboardingCount;
      allCounts.eligibility = eligibilityCount;
      allCounts.document = documentCount;
    }

    allCounts.attendance =
      weekOffCount + regularizationCount + shiftRequestCount;

    allCounts.totalItems =
      weekOffCount +
      regularizationCount +
      shiftRequestCount +
      leaveRequestCount +
      reimbursementCount +
      assetRequestCount +
      (isAllowedForCPDoc
        ? cpOnboardingCount + eligibilityCount + documentCount
        : 0);

    return res.send(
      successRes(200, "Fetched successfully", { data: allCounts })
    );
  } catch (error) {
    console.error("Error fetching admin pending counts:", error);
    return res.send(errorRes(500, "Internal server error"));
  }
});

export default routerV2;
