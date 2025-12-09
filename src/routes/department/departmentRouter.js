import { Router } from "express";
import {
  getDepartment,
  getDepartmentById,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../controller/department.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const deptRouter = Router();
deptRouter.get("/department", getDepartment);
deptRouter.get("/department/:id", authenticateToken, getDepartmentById);

deptRouter.post("/department-add", authenticateToken, addDepartment);
deptRouter.post("/department-update/:id", authenticateToken, updateDepartment);

deptRouter.delete("/department/:id", authenticateToken, deleteDepartment);

export default deptRouter;
