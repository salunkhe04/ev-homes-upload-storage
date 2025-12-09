import { Router } from "express";
import {
  getAssetlist,
  addAssetlist,
  //   getAccessoryById,
  updateAssetlist,
  deleteAssetlist,
} from "../../controller/assetlist.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const assetlistRouter = Router();
assetlistRouter.get("/assetlist", authenticateToken, getAssetlist);
// assetlistRouter.get(
//   "/assetlist/:id",
//   // authenticateToken,
//   getAssetlistById
// );
assetlistRouter.post("/assetlist-add", authenticateToken, addAssetlist);
assetlistRouter.post(
  "/assetlist-update/:id",
  authenticateToken,
  updateAssetlist
);
assetlistRouter.delete("/assetlist/:id", authenticateToken, deleteAssetlist);

export default assetlistRouter;
