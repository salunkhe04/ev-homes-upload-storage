import { Router } from "express";
import permissionModel from "../model/permissions.model.js";
import { errorRes2, successRes2 } from "../model/response.js";
const permissionRouter = Router();

permissionRouter.get("/all-permission", async (req, res) => {
  try {
    //
    const resp = await permissionModel.find();

    return successRes2(res, 200, "", {
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

permissionRouter.post("/add-permission", async (req, res) => {
  const { permission, requiredPermission, remark } = req.body;
  try {
    if (!permission) return errorRes2(res, 401, "permission_required");
    //
    const resp = await permissionModel.create({ ...req.body, _id: permission });

    return successRes2(res, 200, "", {
      data: resp,
    });
  } catch (error) {
    //
    console.log(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

export default permissionRouter;
