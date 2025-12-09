import approvalStepModel from "../model/approvalStep.model.js";
import employeeModel from "../model/employee.model.js";
import empDocReqModel from "../model/employeeDocumentRequest.model.js";
import { errorRes, successRes } from "../model/response.js";
import { empDocRequestPopulate } from "../utils/constant.js";

export const getEmpDocRequests = async (req, res, next) => {
  try {
    const resp = await empDocReqModel.find().populate(empDocRequestPopulate);

    const approvedList = resp.filter((ele) => ele.docReqStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.docReqStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.docReqStatus === "pending");
    return res.send(
      successRes(200, "get employee document requests", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getEmpDocRequestsbyId = async (req, res) => {
  const id = req.params.id;
  try {
    const resp = await empDocReqModel
      .findById(id)
      .populate(empDocRequestPopulate);
    return res.send(
      successRes(200, "get employee document requests", {
        data: resp,
      })
    );
  } catch (e) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addEmpDocRequest = async (req, res, next) => {
  const {appliedBy, empReqDocuments = [] } = req.body;

  try {
    const applybyEmployee = await employeeModel.findById(appliedBy);
    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const reportingTo = applybyEmployee.reportingTo;

    const reportingToEmployee = await employeeModel.findById(reportingTo);
    if (!reportingToEmployee)
      return res.send(errorRes(404, "Reporting To employee not found"));

    const configs = await approvalStepModel.findOne({
      requestType: "employee-doc-req",
    });

    let approvalSteps = [];

    configs.steps.map((ele, index) => {
      if (ele.role == "reportingTo") {
        approvalSteps.push({
          level: index,
          adminId: applybyEmployee.reportingTo,
          status: "pending",
        });
      } else {
        approvalSteps.push({
          level: index,
          adminId: ele.adminId,
          status: "pending",
        });
      }
    });

    // const attendanceRecord = await attendanceModel.findById(attendance);
    // if (!attendanceRecord)
    //   return res.send(errorRes(404, "Attendance record not found"));

    // await attendanceRecord.save();

    const newDocument = await empDocReqModel.create({
      ...req.body,
      appliedDate: new Date(),
      reportingTo,
      approvalStatus: "pending",
      approvalSteps,
      currentLevel: 0,
    });

    const createdDocument = await empDocReqModel
      .findById(newDocument._id)
      .populate(empDocRequestPopulate);

    return res.send(
      successRes(200, "Document added", {
        data: createdDocument,
      })
    );
  } catch (error) {
    console.error("Error adding document:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyEmpRequests = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) { 
      return res.send(errorRes(401, "ID required"));
    }

    const empDoc = await empDocReqModel
      .find({
        appliedBy: id,
      })
      .populate(empDocRequestPopulate);

      // console.log(empDoc.length);
    if (empDoc.length === 0) {
      return res.send(errorRes(404, "No records found"));
    }
    const approvedList = empDoc.filter(
      (ele) => ele.docReqStatus === "approved"
    );
    const rejectedList = empDoc.filter(
      (ele) => ele.docReqStatus === "rejected"
    );
    const pendingList = empDoc.filter(
      (ele) => ele.docReqStatus === "pending"
    );

    return res.send(
      successRes(200, "Records retrieved", {
        data: empDoc,
        approvedList,
        pendingList,
        rejectedList,
      })
    );
  } catch (error) {
    console.error("Error retrieving Regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};


export const onRejectOrApproveDocReq = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const { adminId, approvalReason, remark, approvedDate } = req.body;

    if (!id) return res.send(errorRes(401, "id required"));

    const docReq = await empDocReqModel
      .findById(id)
      .populate(empDocRequestPopulate);

    if (!docReq) return res.send(errorRes(404, "Document request not found"));

    // Find current pending step for the admin
    const step = docReq.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending"
    );

    if (!step)
      return res.send(errorRes(403, "No pending approval for this admin"));

    // Approve or reject this step
    step.status = status;
    step.approvalDate = new Date();
    step.remark = remark || null;
    step.approvalReason = approvalReason || null;
    // approvedDate= new Date();
    if (status === "approved") {
      // Try to find the next step
      let nextStep = docReq.approvalSteps.find(
        (s) => s.level === step.level + 1
      );

      // Auto-approve same admin in next steps
      while (nextStep && nextStep.adminId?._id?.toString() === adminId) {
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.approvalReason = "Auto-approved (same admin)";
        nextStep.remark = "Auto-approved";
        docReq.currentLevel = nextStep.level;

        approvedDate = new Date();

        // Move to next step
        nextStep = docReq.approvalSteps.find(
          (s) => s.level === docReq.currentLevel + 1
        );
      }

      // Update current level to next step if exists
      if (nextStep) {
        docReq.currentLevel = nextStep.level;
      }

      // If all steps approved, mark final status
      const allStepsApproved = docReq.approvalSteps.every(
        (s) => s.status === "approved"
      );

      if (allStepsApproved) {
        docReq.docReqStatus = "approved";
        docReq.empReqDocuments?.map((doc) => {
          doc.status = "approved";
        });

        const empId = docReq.appliedBy?._id || docReq.appliedBy;
        if (empId) {
          const employee = await employeeModel.findById(empId);

          if (employee && Array.isArray(docReq.empReqDocuments)) {
            docReq.empReqDocuments.map((doc) => {
              if (doc?.typeOfDocument) {
                const existingDocIndex = employee.personalDocument.findIndex(
                  (d) =>
                    d?.typeOfDocument?.toLowerCase() ===
                    doc.typeOfDocument.toLowerCase()
                );

                const newDoc = {
                  typeOfDocument: doc.typeOfDocument,
                  documentNumber: doc.documentNumber,
                  name: doc.name,
                  frontSide: doc.frontSide,
                  backSide:doc.backSide,
                };

                if (existingDocIndex !== -1) {
                  // Update existing doc
                  employee.personalDocument[existingDocIndex] = newDoc;
                } else {
                  // Add new doc
                  employee.personalDocument.push(newDoc);
                }
              }
            });

            await employee.save();
          }
        }
      }
    } else {
      // If rejected, stop process
      docReq.docReqStatus = "rejected";
      docReq.empReqDocuments?.map((doc) => {
        doc.status = "rejected";
      });
    }

    await docReq.save();

    return res.send(
      successRes(200, `Request ${status}`, {
        data: docReq,
      })
    );
  } catch (error) {
    console.error("Error in approval process:", error);
    return res.send(errorRes(500, error.message));
  }
};

export const deleteDocReq = async (req, res) => {
  const id = req.params.id;
  try {
    const resp = await empDocReqModel
      .findByIdAndDelete(id)
      .populate(empDocRequestPopulate);
    return res.send(
      successRes(200, "delete employee document requests", {
        data: resp,
      })
    );
  } catch (e) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
