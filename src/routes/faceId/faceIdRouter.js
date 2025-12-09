import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addNewFaceId,
  getFaceIdByFaceId,
  getFaceIdById,
  getFaceIdByUserId,
  getFaceIds,
  updateFaceIdById,
} from "../../controller/faceId.controller.js";
const faceIdRouter = Router();

faceIdRouter.get("/face-id", 
  authenticateToken, getFaceIds);
// faceIdRouter.post("/add-face-id", authenticateToken, addFaceId);
faceIdRouter.post("/add-face-id", authenticateToken, addNewFaceId);
faceIdRouter.get("/face-id/:id", authenticateToken, getFaceIdById);
faceIdRouter.get(
  "/face-id-by-user-id/:id",
  // authenticateToken,
  getFaceIdByUserId
);
faceIdRouter.post(
  "/update-face-id/:id",
  // authenticateToken,
  updateFaceIdById
);

faceIdRouter.get("/face-by-face-id/:id",
  // authenticateToken,
  
  getFaceIdByFaceId);


export default faceIdRouter;
