import { Router } from "express";
import {
  addAppDevTask,
  getAppDevTask,
  getAppDevTaskById,
  getTaskByAssignTo,
  updateTaskFeedback,
} from "../../controller/appDevTask.controller.js";

const appDevRouter = Router();

appDevRouter.get("/dev-tasks", getAppDevTask);
appDevRouter.get("/dev-task-by-id/:id", getAppDevTaskById);
appDevRouter.post("/add-dev-task/:id", addAppDevTask);
appDevRouter.get("/dev-app-task-assign/:id", getTaskByAssignTo);
appDevRouter.post("/dev-update-feedback/:id",updateTaskFeedback); 

export default appDevRouter;

