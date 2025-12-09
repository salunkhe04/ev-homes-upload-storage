import moment from "moment-timezone";
import revisedTargetModel from "../model/bookingTarget/bookingTarget.model.js";
import employeeModel from "../model/employee.model.js";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import { errorRes, errorRes2, successRes } from "../model/response.js";
import { revisedTargetPopulate } from "../utils/constant.js";
import { defaultProjectTargets, getQuarterInfo } from "./quarterInforFun.js";

// Helper to get current quarter info
const zone = "Asia/Kolkata";
// 2025-07-15T11:07:02.283Z
export const getQuarterWiseTarget = async (req, res) => {
  const id = req.params.id;
  const { date, year: qYear, quarter: qQuarter } = req.query;
  console.log(req.query);

  let now = moment(date).isValid() ? moment(date).tz(zone) : moment().tz(zone);

  try {
    const emp = await employeeModel.findById(id);
    if (!emp) return res.send(errorRes(404, "Employee not found"));
    if (qYear && qYear < 2025) {
      return errorRes2(res, 404, "No Target Found");
    }

    if (now.isBefore(moment({ year: 2025, month: 6 }))) {
      //
      return errorRes2(res, 404, "No Target Found");
    }

    const { startDate, endDate, year, quarter } = getQuarterInfo(
      now.toDate(),
      qQuarter,
      qYear
    );

    let statusToFind = {
      staffId: emp._id,
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
      year,
    };

    // if (year && qQuarter) {
    //   statusToFind = {
    //     //
    //     staffId: emp._id,
    //     ...(year && qQuarter ? { quarter: qQuarter } : {}),
    //     year: qYear,
    //   };
    // }

    console.log(JSON.stringify(statusToFind, null, 2));

    let targetData = await revisedTargetModel
      .findOne(statusToFind)
      .populate(revisedTargetPopulate)
      .lean();

    if (!targetData) {
      let totalTarget = 0;

      for (let i = 0; i < defaultProjectTargets.length; i++) {
        const proj = defaultProjectTargets[i];
        totalTarget += proj.target || 0;
      }

      targetData = await revisedTargetModel.create({
        staffId: emp._id,
        target: totalTarget,
        startDate,
        endDate,
        year,
        quarter,
        projectWise: defaultProjectTargets,
      });

      targetData = await revisedTargetModel
        .findById(targetData._id)
        .populate(revisedTargetPopulate)
        .lean();
    }

    const projectWiseResults = [];

    for (const project of targetData.projectWise) {
      const projectId = project.projectId;

      const bookings = await postSaleLeadModel.countDocuments({
        closingManager: emp._id,
        project: projectId,
        "bookingStatus.type": "confirm-booking",
        date: { $gte: startDate, $lte: endDate },
      });

      const registration = await postSaleLeadModel.countDocuments({
        closingManager: emp._id,
        project: projectId,
        registrationDone: true,
        date: { $gte: startDate, $lte: endDate },
      });

      projectWiseResults.push({
        projectId,
        target: project.target || 0,
        bookings,
        registration,
      });
    }

    return res.send(
      successRes(200, "Data fetched!", {
        data: {
          ...targetData,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching quarter-wise target:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const addTarget = async (req, res) => {
  try {
    const { staffId, projectWise } = req.body;
    let totalTarget = 0;

    if (!staffId || !projectWise || !Array.isArray(projectWise)) {
      return res.send(
        errorRes(400, "staffId and projectWise array are required.")
      );
    }

    const { quarter, startDate, endDate, year } = getQuarterInfo();

    for (let i = 0; i < projectWise.length; i++) {
      const project = projectWise[i];
      if (project) {
        totalTarget += project.target;
      }
    }

    // Check if already exists
    const exists = await revisedTargetModel.findOne({
      staffId,
      startDate,
      endDate,
      year,
    });

    if (exists) {
      return res.send(
        errorRes(
          400,
          "Target already set for this staff in the current quarter."
        )
      );
    }

    const newTarget = await revisedTargetModel.create({
      staffId,
      target: totalTarget,
      projectWise,
      startDate,
      endDate,
      year,
      quarter,
      booking: [],
      registration: [],
    });

    return res.send(
      successRes(200, "Target added successfully", { data: newTarget })
    );
  } catch (error) {
    console.error("Error in addTarget:", error);
    return res.send(errorRes(400, "internal sever error"));
  }
};
