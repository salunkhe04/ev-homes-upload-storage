import examModel from "../model/exam.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getExams = async (req, res, next) => {
  try {
    const respMe = await examModel.find();
    return res.send(
      successRes(200, "Get Exams", {
        data: respMe,
      })
    );
  } catch (e) {
    console.log(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const getExamsById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const respMe = await examModel.findById(id);

    return res.send(
      successRes(200, "Exams By ID", {
        data: respMe,
      })
    );
  } catch (e) {
    console.log(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const addExams = async (req, res, next) => {
  const body = req.body;
  try {
    // const applybyEmployee = await employeeModel.findById(appliedBy);
    // .populate(eligibilityRequestPopulate);

    const newRequest = await examModel.create(body);

    return res.send(
      successRes(200, "Request added", {
        data: newRequest,
      })
    );
  } catch (e) {
    console.log(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const deleteExam = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    const deleteEligibility = await examModel.findByIdAndDelete(id);
    //   .populate(eligibilityRequestPopulate);
    if (!deleteEligibility) return res.send(errorRes(404, `not found`));
    return res.send(
      successRes(200, `Deleted successfully`, {
        data: deleteEligibility,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const updateExam = async (req, res) => {
  const id = req.params.id;
  const { questions } = req.body;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!questions || !Array.isArray(questions)) {
      return res.send(errorRes(400, "Questions array is required"));
    }

    const updateExam = await examModel.findByIdAndUpdate(
      id,
      { $push: { questions: { $each: questions } } },
      { new: true }
    );

    if (!updateExam) return res.send(errorRes(404, `Exam not found`));

    return res.send(
      successRes(200, `Questions added successfully`, {
        data: updateExam,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
