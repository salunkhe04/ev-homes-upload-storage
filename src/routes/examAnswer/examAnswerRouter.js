import { Router } from "express";
import {
  addAnswer,
  addExamTimeLine,
  getExamResponse,
  saveAnswer,
  submitExam,
} from "../../controller/examAnswer.controller.js";

const examAnswerRouter = Router();
examAnswerRouter.get("/exam-answer", getExamResponse);
examAnswerRouter.post("/submit-exam-answer/:id", addAnswer);
examAnswerRouter.post("/submit-exam/:id", submitExam);
examAnswerRouter.post("/save-answer/:id", saveAnswer);
//
examAnswerRouter.post("/add-exam-timeline/:id", addExamTimeLine);
//
export default examAnswerRouter;
