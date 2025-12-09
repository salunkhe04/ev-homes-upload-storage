import { Router } from "express";
import { addExams, deleteExam, getExams, getExamsById, updateExam } from "../../controller/exam.controller.js";

const examRouter = Router();

examRouter.get("/exams",getExams);
examRouter.get("/exam/:id",getExamsById);
examRouter.post("/add-exams",addExams);
examRouter.delete("/delete-exam/:id",deleteExam);
examRouter.post("/update-exam/:id",updateExam);
export default examRouter;
