import moment from "moment";
import approvalStepModel from "../model/approvalStep.model.js";
import eligibilityModel from "../model/eligibilityRequest.model.js";
import employeeModel from "../model/employee.model.js";
import { errorRes, successRes } from "../model/response.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import {
  eligibilityRequestPopulate,
  employeePopulateOptions,
} from "../utils/constant.js";
import examModel from "../model/exam.model.js";
import examAnswerModel from "../model/examAnswer.model.js";
import logger from "../utils/logger.js";

export const getEligibiltyRequest = async (req, res, next) => {
  try {
    const respMe = await eligibilityModel
      .find()
      .populate(eligibilityRequestPopulate)
      .sort({ appliedDate: -1 });

    return res.send(
      successRes(200, "Eligible", {
        data: respMe,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const getEligibiltyRequestById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const respMe = await eligibilityModel
      .findById(id)
      .populate(eligibilityRequestPopulate);

    return res.send(
      successRes(200, "Eligible", {
        data: respMe,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error $e`));
  }
};

export const getRequestByAppliedBy = async (req, res, next) => {
  const appliedBy = req.params.id;

  try {
    const applybyEmployee = await employeeModel.findById(appliedBy);
    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const resp = await eligibilityModel
      .findOne({ appliedBy })
      .sort({ createdAt: -1 })
      .populate(eligibilityRequestPopulate);

    return res.send(
      successRes(200, "Requests made by appliedBy ID", {
        data: resp,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const addEligibilityRequest = async (req, res, next) => {
  const { scale, reason, appliedBy, status, appliedDate } = req.body;
  // const body = req.body;
  try {
    const applybyEmployee = await employeeModel
      .findById(appliedBy)
      .populate(employeePopulateOptions);

    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const configs = await approvalStepModel.findOne({
      requestType: "eligibility",
    });

    let approvalSteps = [];
    configs.steps.map((ele, index) => {
      // if (ele.role == "reportingTo") {
      //   approvalSteps.push({
      //     level: index,
      //     adminId: applybyEmployee.reportingTo,
      //     status: "pending",
      //   });
      // } else {
      approvalSteps.push({
        level: index,
        adminId: ele.adminId,
        status: "pending",
      });
      // }
    });

    const newRequest = await eligibilityModel.create({
      ...req.body,
      status: "under-review",
      approvalSteps,
      appliedDate: new Date(),
    });

    const populateResp = await eligibilityModel
      .findById(newRequest._id)
      .populate(eligibilityRequestPopulate);
    await newRequest.save();
    return res.send(
      successRes(200, "Request added", {
        data: populateResp,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const deleteEligibilityRequest = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Shift ID is required"));
    const deleteEligibility = await eligibilityModel
      .findByIdAndDelete(id)
      .populate(eligibilityRequestPopulate);
    if (!deleteEligibility) return res.send(errorRes(404, `not found`));
    return res.send(
      successRes(200, `Deleted successfully`, {
        data: deleteEligibility,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const updateEligibilityApproval = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const {
      adminId,
      approvalReason,
      examConductedDate,
      examEntryDeadline,
      typeOfAttempt,
      durationInMinutes,
      tests,
      examTitle,
      passingMarks,
    } = req.body;

    // logger.info(tests);
    // logger.info(req.body);

    const eligibleReq = await eligibilityModel
      .findById(id)
      .populate(eligibilityRequestPopulate);
    // .populate();

    if (!eligibleReq) return res.send(errorRes(400, "Request not found"));
    // if(!exam)return res.send(errorRes(404, "exam is required an exam"));

    // logger.info(eligibleReq);
    const step = eligibleReq.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending",
    );
    // logger.info(step);
    // logger.info("id:", adminId);
    // logger.info("st:", status);
    // logger.info("pproval Steps:", eligibleReq.approvalSteps);

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    if (!step) {
      if (status === "approved") {
        // if already approved
        try {
          let questions = [];

          let exIds = tests?.map((ele) => ele?.exam) ?? [];

          const exams = await examModel
            .find({
              _id: exIds,
            })
            .lean();

          tests.forEach((ele) => {
            const foundExam = exams.find((exam) => exam?._id == ele?.exam);
            if (foundExam) {
              // Shuffle the questions
              let shuffled = shuffleArray([...foundExam.questions]);
              // Pick 'count' number of random questions
              let selected = shuffled.slice(0, ele?.count ?? 0);

              // Add exam title to each question
              let enriched = selected.map((q) => ({
                ...q,
                title: foundExam.title,
              }));

              questions.push(...enriched);
            }
          });

          const createdExam = await examAnswerModel.create({
            eligibilityRequest: id,
            appliedBy: eligibleReq.appliedBy,
            startTime: examConductedDate,
            questions: questions,
            durationInMinutes: durationInMinutes,
            attemptType: typeOfAttempt,
            examEntryDeadline: examEntryDeadline,
            examTitle: examTitle,
            passingMarks: passingMarks,
          });

          const updatedTest = await eligibilityModel.findByIdAndUpdate(
            eligibleReq,
            {
              scheduleExam: createdExam,
              examConductedDate: examConductedDate,
              typeOfAttempt: typeOfAttempt,
            },
          );
          eligibleReq.status = "exam-schedule";
        } catch (error) {
          logger.info(error);
        }
        await eligibleReq.save();
        return res.send(
          successRes(200, `Request ${status}`, { data: eligibleReq }),
        );
      }

      return res.send(errorRes(403, "No pending approval for this admin"));
    }

    step.status = status;
    step.approvalDate = new Date();
    step.remark = approvalReason;
    // approvedDate =new Date();

    if (status === "approved") {
      try {
        let questions = [];

        let exIds = tests?.map((ele) => ele?.exam) ?? [];

        const exams = await examModel
          .find({
            _id: exIds,
          })
          .lean();

        tests.forEach((ele) => {
          const foundExam = exams.find((exam) => exam?._id == ele?.exam);
          if (foundExam) {
            // Shuffle the questions
            let shuffled = shuffleArray([...foundExam.questions]);
            // Pick 'count' number of random questions
            let selected = shuffled.slice(0, ele?.count ?? 0);

            // Add exam title to each question
            let enriched = selected.map((q) => ({
              ...q,
              title: foundExam.title,
            }));

            questions.push(...enriched);
          }
        });

        const createdExam = await examAnswerModel.create({
          eligibilityRequest: id,
          appliedBy: eligibleReq.appliedBy,
          startTime: examConductedDate,
          questions: questions,
          durationInMinutes: durationInMinutes,
          attemptType: typeOfAttempt,
          examEntryDeadline: examEntryDeadline,
          examTitle: examTitle,
        });

        const updatedTest = await eligibilityModel.findByIdAndUpdate(
          eligibleReq,
          {
            scheduleExam: createdExam,
            examConductedDate: examConductedDate,
            typeOfAttempt: typeOfAttempt,
          },
        );
      } catch (error) {
        logger.info(error);
      }

      let nextStep = eligibleReq.approvalSteps.find(
        (s) => s.level === step.level + 1,
      );

      while (nextStep && nextStep.adminId?._id.toString() === adminId) {
        // logger.info(nextStep);
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.remark = "Auto-approved (same admin)";
        eligibleReq.currentLevel = nextStep.level;
        nextStep = eligibleReq.approvalSteps.find(
          (s) => s.level === eligibleReq.currentLevel + 1,
        );
      }

      if (!nextStep) {
        eligibleReq.status = "exam-schedule";
      }

      if (nextStep && nextStep.adminId?._id.toString() != adminId) {
        eligibleReq.currentLevel = nextStep.level;
      }
    } else {
      eligibleReq.status = "rejected";
    }

    await eligibleReq.save();
    return res.send(
      successRes(200, `Request ${status}`, { data: eligibleReq }),
    );
  } catch (error) {
    // logger.info(error);
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const getEligibleCriteria = async (req, res, next) => {
  const appliedBy = req.params.id;

  try {
    let totalDays = 0;
    let presentDays = 0;
    let graceCount = 0;

    const employee = await employeeModel.findById(appliedBy);
    // .populate(eligibilityRequestPopulate);
    if (!employee) {
      return res.send(errorRes(404, "Employee not found"));
    }
    // const eligibilityRequest = await eligibilityModel.findOne({ appliedBy });
    // if (!eligibilityRequest) {
    //   return res.send(errorRes(400, "No request made"));
    // }

    //attenance 90%
    const attendanceRecords = await attendanceModel.find({
      userId: appliedBy,
    });

    if (attendanceRecords.length === 0) {
      return res.send(errorRes(400, "No attendance records found"));
    }

    const sixMonthsAgo = moment().subtract(6, "months").startOf("day").toDate();

    attendanceRecords.forEach((rec) => {
      const compareDate = new Date(rec.date);
      const excludedStatuses = [
        "weekoff",
        "on-casual-leave",
        "on-leave",
        "on-paid-leave",
        "on-compensation-off-leave",
      ];

      const skip = excludedStatuses.includes(rec.status);

      //90% attendance
      if (!skip) {
        totalDays++;
        if (rec.status === "present") {
          presentDays++;
        }
      }

      // late arrival
      if (rec.wlStatus === "grace-time" && compareDate >= sixMonthsAgo) {
        graceCount++;
      }
    });
    const presentPercentage = (presentDays / totalDays) * 100;
    const hasSufficientAttendance = presentPercentage >= 80;
    const hasAcceptableGrace = graceCount <= 10;

    let hasRequiredExperience = false;
    const joiningDate = moment(employee.joiningDate);

    //experience
    if (employee.experienceStatus === "experience") {
      const threeMonthsAgo = moment().subtract(3, "months");
      hasRequiredExperience = joiningDate.isSameOrBefore(threeMonthsAgo);
    } else if (employee.experienceStatus === "fresher") {
      const sixMonthsAgo = moment().subtract(6, "months");
      hasRequiredExperience = joiningDate.isSameOrBefore(sixMonthsAgo);
    } else {
      const sixMonthsAgo = moment().subtract(6, "months");
      hasRequiredExperience = joiningDate.isSameOrBefore(sixMonthsAgo);
    }

    const isEligible =
      hasSufficientAttendance && hasAcceptableGrace && hasRequiredExperience;

    return res.send(
      successRes(200, "Eligibility status", {
        data: {
          eligible: isEligible,
          presentDays,
          totalDays,
          presentPercentage: presentPercentage.toFixed(2),
          graceTimeCount: graceCount,
          experienceStatus: employee.experienceStatus,
          hasRequiredExperience,
          hasSufficientAttendance,
          hasAcceptableGrace,
          // employee,
        },
        eligible: isEligible,
        presentDays,
        totalDays,
        presentPercentage: presentPercentage.toFixed(2),
        graceTimeCount: graceCount,
        experienceStatus: employee.experienceStatus,
        hasRequiredExperience,
        // employee,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};

export const deleteEligibiltyRequestById = async (req, res, next) => {
  const id = req.params.id;
  try {
    // logger.info("ohk");
    // logger.info(id);
    const respMe = await eligibilityModel.findByIdAndDelete(id);

    // logger.info("ohk 2");
    return res.send(
      successRes(200, "Eligible", {
        data: respMe,
      }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error $e`));
  }
};

export const updateExamStatus = async (req, res, next) => {
  const { id, status } = req.params;
  const { pdf } = req.query;

  try {
    if (!id || !status) {
      return res.send(errorRes(400, "Both id and status are required"));
    }

    const updated = await eligibilityModel.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true },
    );

    if (!updated) {
      return res.send(errorRes(404, "Exam record not found"));
    }

    if (pdf) {
      //
      try {
        await examAnswerModel.findByIdAndUpdate(updated.scheduleExam, {
          pdf: pdf,
        });
      } catch (error) {
        logger.info(error);
      }
    }

    const newResp = await eligibilityModel
      .findById(updated._id)
      .populate(eligibilityRequestPopulate);

    return res.send(
      successRes(200, "Status updated successfully", { data: newResp }),
    );
  } catch (e) {
    logger.info("Error updating exam status:", e);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
