import { Router } from "express";
import {
  deleteEmployeeById,
  editEmployeeById,
  forgotPasswordEmployee,
  getVisitEntryAllowedStaff,
  getEmployeeByDesignation,
  getEmployeeById,
  getEmployees,
  getPostSaleExecutives,
  getPreSalesExecutive,
  getSalesManagers,
  getSeniorClosingManagers,
  getTeamLeaderCSM,
  getTeamLeaders,
  loginEmployee,
  registerEmployee,
  resetPasswordEmployee,
  searchEmployee,
  getReportingTo,
  getEmployeeReAuth,
  newPassword,
  reAuthEmployee,
  registerMpin,
  validateMpin,
  getDataAnalyzers,
  sendAddLeaveNotification,
  getEmployeesForAttendance,
  getEmployeeByCustomRole,
} from "../../controller/employee.controller.js";
import { validateEmployeeFields } from "../../middleware/employee.middleware.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import employeeModel from "../../model/employee.model.js";
import shiftInfoModel from "../../model/attendance/shift/employeeShiftInfo.js";
import moment from "moment-timezone";
import { employeePopulateOptions } from "../../utils/constant.js";
import logger from "../../utils/logger.js";

const employeeRouter = Router();

employeeRouter.get("/employee", authenticateToken, getEmployees);

employeeRouter.get("/employee-for-attendance", getEmployeesForAttendance);

employeeRouter.get("/employee/:id", authenticateToken, getEmployeeById);
employeeRouter.get("/employee-reauth", getEmployeeReAuth);

employeeRouter.get(
  "/employee-visit-allowed-staff",
  authenticateToken,
  getVisitEntryAllowedStaff,
);

employeeRouter.get(
  "/employee-team-leader-csm",
  authenticateToken,
  getTeamLeaderCSM,
);
employeeRouter.get(
  "/employee-reporting/:id",
  // authenticateToken,
  getReportingTo,
);

employeeRouter.get(
  "/employee-closing-manager",
  authenticateToken,
  getSeniorClosingManagers,
);

employeeRouter.get(
  "/employee-post-sales-executive",
  authenticateToken,
  getPostSaleExecutives,
);

employeeRouter.get(
  "/employee-sales-manager",
  authenticateToken,
  getSalesManagers,
);

employeeRouter.get(
  "/employee-by-designation/:id",
  authenticateToken,
  getEmployeeByDesignation,
);

employeeRouter.get(
  "/employees-by-custom-role",
  // authenticateToken,
  getEmployeeByCustomRole,
);

employeeRouter.get("/employee-team-leader", authenticateToken, getTeamLeaders);

employeeRouter.get(
  "/employee-data-analzer",
  authenticateToken,
  getDataAnalyzers,
);

employeeRouter.get(
  "/employee-pre-sale-executive",
  authenticateToken,
  getPreSalesExecutive,
);

employeeRouter.post("/employee-mpin-register/:id", registerMpin);

employeeRouter.post("/employee-validate/:id", validateMpin);

employeeRouter.post(
  "/employee-register",
  validateEmployeeFields,
  registerEmployee,
);
employeeRouter.post("/employee-login", validateEmployeeFields, loginEmployee);

employeeRouter.post("/validate-employee-session", getEmployeeReAuth);

employeeRouter.post(
  "/employee-edit/:id",
  authenticateToken,
  validateEmployeeFields,
  editEmployeeById,
);

employeeRouter.post(
  "/employee-forgot-password",
  validateEmployeeFields,
  forgotPasswordEmployee,
);

employeeRouter.post(
  "/employee-reset-password",
  validateEmployeeFields,
  resetPasswordEmployee,
);
employeeRouter.post("/employee-pw/:id", newPassword);

employeeRouter.delete("/employee/:id", authenticateToken, deleteEmployeeById);

employeeRouter.get("/search-employee", authenticateToken, searchEmployee);

employeeRouter.post(
  "/send-leave-notification",
  // authenticateToken,
  sendAddLeaveNotification,
);

// Route to serve the password reset page
employeeRouter.get("/reset-password", (req, res) => {
  res.render("reset-password", { pageTitle: "Reset Your Password" });
});

employeeRouter.post("/employee-logout", async (req, res) => {
  try {
    res.cookie("refreshToken", null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 0,
      path: "/",
    });
    res.cookie("accessToken", null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 0,
      path: "/",
    });
    return successRes2(res, 200, "logged Out");
  } catch (error) {
    return errorRes2(res, 500, error);
  }
});

employeeRouter.post("/make-inactive/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resp = await employeeModel
      .findByIdAndUpdate(
        id,

        { status: "inactive" },

        { new: true },
      )
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    const dataResp = await employeeModel.findById(resp._id);

    return successRes2(res, 200, "Inactive", { data: resp });
  } catch (e) {
    return errorRes2(res, 500, error);
  }
});

// employeeRouter.put('/update-experience-status', async (req, res) => {
//   try {
//     const designations = [
//       "desg-senior-closing-manager",
//       "desg-floor-manager",
//       "desg-site-head",
//       "desg-sales-executive",
//       "desg-front-desk-executive",
//       "desg-data-analyzer",
//       "desg-senior-sales-manager",
//       "desg-sales-manager",
//     ];

//     const result = await employeeModel.updateMany(
//       { designation: { $in: designations } },
//       { $set: { experienceStatus: "experience" } }
//     );

//     res.status(200).json({
//       message: 'Experience status updated successfully',
//       modifiedCount: result.modifiedCount,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// });

employeeRouter.post("/emp-attach-shift", async (req, res) => {
  try {
    //
    const emps = await employeeModel.find();
    await Promise.all(
      emps.map(async (ele) => {
        //
        try {
          //
          const foundShifInfo = await shiftInfoModel.findOne({
            userId: ele._id,
          });
          if (foundShifInfo) {
            await employeeModel.findByIdAndUpdate(ele._id, {
              $set: {
                shifInfo: foundShifInfo._id,
              },
            });
          }
        } catch (error) {
          //
          logger.info(error);
        }
      }),
    );
    res.send("ok");
  } catch (error) {
    //
    res.send(error);
  }
});

employeeRouter.get("/emp-list-bd", async (req, res) => {
  try {
    //
    const eList = [];

    const emps = await employeeModel.find({
      status: "active",
      $or: [
        { division: "div-vashi-sector-9" },
        { division: "div-vashi-sector-10" },
      ],
    });

    emps.map((ele) => {
      eList.push({
        name: `${ele.firstName} ${ele.lastName}`,
        dob: moment(ele.dateOfBirth).isValid()
          ? `${moment(ele.dateOfBirth).tz("Asia/Kolkata").format("DD-MM-YYYY")}`
          : "",
      });
    });

    res.send(eList);
  } catch (error) {
    //
    res.send(error);
  }
});

export default employeeRouter;
