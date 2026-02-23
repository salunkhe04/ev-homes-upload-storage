import eligibilityModel from "../model/eligibilityRequest.model.js";
import examModel from "../model/exam.model.js";
import examAnswerModel from "../model/examAnswer.model.js";
import { errorRes, errorRes2, successRes } from "../model/response.js";
import {
  eligibilityAnswerPopulate,
  eligibilityRequestPopulate,
} from "../utils/constant.js";
import logger from "../utils/logger.js";

export const getExamResponse = async (req, res, next) => {
  try {
    const respMe = await examAnswerModel.find();
    return res.send(
      successRes(200, "Get Exam Resoponse", {
        data: respMe,
      }),
    );
  } catch (e) {
    logger.error(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

// export const addAnswer = async (req, res) => {
//   const eligibilityRequestId = req.params.id;

//   try {
//     const { questionText, selectedAnswer } = req.body;
//     let totalMarksObtained = 0;

//     //eligibility request with populated exam
//     const eligibility = await eligibilityModel
//       .findById(eligibilityRequestId)
//       .populate(eligibilityRequestPopulate);

//     if (!eligibility) {
//       return res.send(errorRes(404, "Eligibility request not found"));
//     }

//     if (eligibility.status !== "approved") {
//       return res.send(errorRes(403, "Eligibility request is not approved"));
//     }

//     if (eligibility.typeOfAttempt === "mock" && eligibility.mockAttempt >= 1) {
//       return res.send(errorRes(403, "Only 1 mock exam is allowed"));
//     } else if (
//       eligibility.typeOfAttempt === "regular" &&
//       eligibility.attemptsTaken >= 8
//     ) {
//       return res.send(errorRes(403, "All attempts are used"));
//     }

//     if (!Array.isArray(selectedAnswer)) {
//       return res.send(
//         errorRes(400, "Selected answers are required and must be an array")
//       );
//     }

//     //marks
//     const processedAnswers = eligibility.exam.questions.map((question) => {
//       const selectedEntry = selectedAnswer.find(
//         (ans) => ans.questionText === question.questionText // OR use ans.questionId === question._id.toString()
//       );

//       const ans = selectedEntry?.selectedAnswer;
//       const isCorrect = ans === question.correctAnswer;
//       const marksObtained = isCorrect ? question.marks : 0;
//       totalMarksObtained += marksObtained;

//       return {
//         questionText: question.questionText,
//         options: question.options,
//         correctAnswer: question.correctAnswer,
//         selectedAnswer: ans,
//         marks: question.marks,
//         marksObtained,
//       };
//     });

//     const passed = totalMarksObtained >= eligibility.exam.passingMarks;

//     if (exam != null) {
//       eligibility.examConductedDate <= eligibility.exam.durationInMinutes;
//     } else {
//       return res.send(errorRes(400, "Time over!"));
//     }

//     //previous attempts
//     const previousAttempts = eligibility.examAttempts.length;

//     //ceate and save examAnswer
//     const newAnswer = new examAnswerModel({
//       eligibilityRequest: eligibilityRequestId,
//       appliedBy: eligibility.appliedBy,
//       startTime: new Date(),
//       endTime: new Date(),
//       marksObtained: totalMarksObtained,
//       passed,
//       attempt: previousAttempts + 1,
//       objectiveAnswers: processedAnswers,
//     });

//     await newAnswer.save();

//     // examAttempt object
//     const examAttemptEntry = {
//       attemptNumber: previousAttempts + 1,
//       exam: eligibility.exam._id,
//       examAnswer: newAnswer._id,
//       marksObtained: totalMarksObtained,
//       passed,
//     };

//     // eligibility request with new attempt
//     const updateData = {
//       $push: { examAttempts: examAttemptEntry },
//     };

//     if (eligibility.typeOfAttempt === "mock") {
//       updateData.$inc = { mockAttempt: 1, attemptsTaken: 1 };
//       // updateData.$inc={attemptsTaken: 1};
//     } else {
//       updateData.$inc = { attemptsTaken: 1 };
//     }

//     await eligibilityModel.findByIdAndUpdate(eligibilityRequestId, updateData);

//     return res.send(
//       successRes(200, "Exam submitted successfully", { data: newAnswer })
//     );
//   } catch (e) {
//     return res.send(errorRes(500, `Server error: ${e.message}`));
//   }
// };

export const addAnswer = async (req, res) => {
  const eligibilityRequestId = req.params.id;

  try {
    const { questionText, selectedAnswer } = req.body;
    let totalMarksObtained = 0;

    const eligibility = await eligibilityModel
      .findById(eligibilityRequestId)
      .populate(eligibilityRequestPopulate);

    if (!eligibility) {
      return res.send(errorRes(404, "Eligibility request not found"));
    }

    if (eligibility.status !== "approved") {
      return res.send(errorRes(403, "Eligibility request is not approved"));
    }

    if (eligibility.typeOfAttempt === "mock" && eligibility.mockAttempt >= 1) {
      return res.send(errorRes(403, "Only 1 mock exam is allowed"));
    } else if (
      eligibility.typeOfAttempt === "regular" &&
      eligibility.attemptsTaken >= 8
    ) {
      return res.send(errorRes(403, "All attempts are used"));
    }

    if (!Array.isArray(selectedAnswer)) {
      return res.send(
        errorRes(400, "Selected answers are required and must be an array"),
      );
    }

    const now = new Date();

    // logger.info(now);

    const scheduledDate = new Date(eligibility.examConductedDate);

    // logger.info(scheduledDate);
    const durationMinutes = eligibility.exam?.durationInMinutes || 0;

    // logger.info(durationMinutes);
    const examEndTime = new Date(
      scheduledDate.getTime() + durationMinutes * 60000,
    );

    // logger.info(examEndTime);

    if (now < scheduledDate) {
      return res.send(
        errorRes(403, "Please wait until your scheduled exam time."),
      );
    }

    if (now > examEndTime) {
      return res.send(errorRes(403, "You have missed the exam time."));
    }

    const processedAnswers = eligibility.exam.questions.map((question) => {
      const selectedEntry = selectedAnswer.find(
        (ans) => ans.questionText === question.questionText,
      );

      const ans = selectedEntry?.selectedAnswer;

      let check;
      if (ans === question.correctAnswer) {
        check = true;
      } else {
        check = false;
      }

      const isCorrect = check;
      const marksObtained = isCorrect ? question.marks : 0;
      totalMarksObtained += marksObtained;

      return {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: ans,
        marks: question.marks,
        marksObtained,
      };
    });

    const passed = totalMarksObtained >= eligibility.exam.passingMarks;
    const previousAttempts = eligibility.examAttempts.length;

    const newAnswer = new examAnswerModel({
      eligibilityRequest: eligibilityRequestId,
      appliedBy: eligibility.appliedBy,
      startTime: now,
      endTime: now,
      marksObtained: totalMarksObtained,
      passed,
      attempt: previousAttempts + 1,
      objectiveAnswers: processedAnswers,
    });

    await newAnswer.save();

    const examAttemptEntry = {
      attemptNumber: previousAttempts + 1,
      exam: eligibility.exam._id,
      examAnswer: newAnswer._id,
      marksObtained: totalMarksObtained,
      passed,
    };

    const updateData = {
      $push: { examAttempts: examAttemptEntry },
    };

    if (eligibility.typeOfAttempt === "mock") {
      updateData.$inc = { mockAttempt: 1, attemptsTaken: 1 };
    } else {
      updateData.$inc = { attemptsTaken: 1 };
    }

    await eligibilityModel.findByIdAndUpdate(eligibilityRequestId, updateData);

    return res.send(
      successRes(200, "Exam submitted successfully", { data: newAnswer }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};

export const submitExam = async (req, res) => {
  const examId = req.params.id;

  try {
    const { questions, recording, score, timeTaken } = req.body;

    // logger.info(examId);
    // logger.info(req.body);

    if (questions && !Array.isArray(questions)) {
      return res.send(
        errorRes(400, "Selected answers are required and must be an array"),
      );
    }
    // logger.info("pass 1");

    let totalMarksObtained = 0;

    const foundExam = await examAnswerModel.findById(examId);
    // logger.info("pass 2");

    if (!foundExam) {
      return res.send(errorRes(404, "foundExam request not found"));
    }
    // logger.info("pass 3");

    const eligibility = await eligibilityModel.findById(
      foundExam?.eligibilityRequest,
    );
    // logger.info("pass 4");

    const now = new Date();

    // if (now < scheduledDate) {
    //   return res.send(
    //     errorRes(403, "Please wait until your scheduled exam time.")
    //   );
    // }

    // if (now > examEndTime) {
    //   return res.send(errorRes(403, "You have missed the exam time."));
    // }

    const processedAnswers = questions.map((question) => {
      // const question = question?.questionText;
      const selectedAnswer = question?.selectedAnswer;
      const correctAnswer = question?.correctAnswer;

      let check = false;
      if (selectedAnswer === correctAnswer) {
        check = true;
      }

      const isCorrect = check;
      const marksObtained = isCorrect ? question.marks : 0;
      totalMarksObtained += marksObtained;

      return {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: correctAnswer,
        selectedAnswer: selectedAnswer,
        marks: question.marks,
        marksObtained,
      };
    });

    // logger.info("pass 5");
    const passed = totalMarksObtained >= foundExam.passingMarks;
    const previousAttempts = eligibility.examAttempts.length;

    // logger.info("pass 6");
    const updatedAnswers = await examAnswerModel.findByIdAndUpdate(
      examId,
      {
        $set: {
          questions: processedAnswers,
          recording,
          score,
          timeTaken,
        },
      },
      { new: true },
    );

    // logger.info("pass 7");
    const examAttemptEntry = {
      attemptNumber: previousAttempts + 1,
      examAnswer: foundExam?._id,
      marksObtained: totalMarksObtained,
      passed,
    };

    // logger.info("pass 8");
    const updateData = {
      $push: { examAttempts: examAttemptEntry },
      status: "exam-under-review",
    };

    // logger.info("pass 9");
    if (eligibility.typeOfAttempt === "mock") {
      updateData.$inc = { mockAttempt: 1, attemptsTaken: 1 };
    } else {
      updateData.$inc = { attemptsTaken: 1 };
    }
    // logger.info("pass 10");

    await eligibilityModel.findByIdAndUpdate(
      foundExam?.eligibilityRequest,
      updateData,
    );

    // logger.info("pass 11");

    return res.send(
      successRes(200, "Exam submitted successfully", { data: updatedAnswers }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};

export const addExamTimeLine = async (req, res) => {
  const examId = req.params.id;

  try {
    const { selfie, screenshot, date = new Date() } = req.body;

    // if (!selfie || !screenshot) return errorRes2(res, 401, "data required");

    const foundExam = await examAnswerModel.findByIdAndUpdate(
      examId,
      {
        $push: {
          //
          timeline: {
            selfie,
            screenshot,
            date,
          },
        },
      },
      { new: true },
    );

    return res.send(
      successRes(200, "Exam Timeline added", { data: foundExam }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};

export const saveAnswer = async (req, res) => {
  const examId = req.params.id;

  try {
    const { questions, recording, score, timeTaken } = req.body;

    // logger.info(examId);
    // logger.info(req.body);

    if (questions && !Array.isArray(questions)) {
      return res.send(
        errorRes(400, "Selected answers are required and must be an array"),
      );
    }
    // logger.info("pass 1");

    let totalMarksObtained = 0;

    const foundExam = await examAnswerModel.findById(examId);
    // logger.info("pass 2");

    if (!foundExam) {
      return res.send(errorRes(404, "foundExam request not found"));
    }

    const processedAnswers = questions.map((question) => {
      // const question = question?.questionText;
      const selectedAnswer = question?.selectedAnswer;
      const correctAnswer = question?.correctAnswer;

      let check = false;
      if (selectedAnswer === correctAnswer) {
        check = true;
      }

      const isCorrect = check;
      const marksObtained = isCorrect ? question.marks : 0;
      totalMarksObtained += marksObtained;

      return {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: correctAnswer,
        selectedAnswer: selectedAnswer,
        marks: question.marks,
        marksObtained,
      };
    });

    // logger.info("pass 6");
    const updatedAnswers = await examAnswerModel.findByIdAndUpdate(
      examId,
      {
        $set: {
          questions: processedAnswers,
        },
      },
      { new: true },
    );

    // logger.info("pass 7");
    // logger.info("pass 11");

    return res.send(
      successRes(200, "Exam submitted successfully", { data: updatedAnswers }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};
