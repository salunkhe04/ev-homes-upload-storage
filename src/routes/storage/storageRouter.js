import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

import jwt from "jsonwebtoken";
import config from "../../config/config.js";
import {
  deleteFile,
  getFileLink,
  uploadFile,
  uploadMultiple,
} from "../../controller/storage.controller.js";
import storageModel from "../../model/storage.model.js";
import attendanceModel from "../../model/attendance/attendance.model.js";
import timeTrackerActivityModel from "../../model/timeline/timelineActivity.model.js";

// Manually define __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir =
  config.STORAGE_ABSOLUTE_PATH ?? path.resolve(__dirname, "../../../uploads");
// Multer setup for file uploads
// Ensure directory exists or create it
function ensureDirectoryExists(dirPath) {
  import("fs").then((fs) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

// Multer setup for file uploads with dynamic subdirectory
export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check if a custom subdirectory path is provided in the query or headers
    const subPath = req.query.path || req.headers["x-upload-path"] || ""; // Customize as needed
    const finalPath = path.join(uploadsDir, subPath);

    // Ensure the directory exists
    ensureDirectoryExists(finalPath);

    cb(null, finalPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname
      ?.replace(/\s+/g, "-")
      .toLowerCase()}`;
    cb(null, uniqueName);
  },
});

// export const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = `${uuidv4()}-${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});
const storageRouter = Router();

function verifyTokenFromURL(req, res, next) {
  const token = req.query.token;
  if (!token) return res.sendStatus(403);

  jwt.verify(token, config.SECRET_STORAGE_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

storageRouter.post("/upload", upload.single("file"), uploadFile);

storageRouter.post("/uploads", upload.array("files", 10), uploadMultiple);

storageRouter.get("/file/:filename", verifyTokenFromURL, getFileLink);

// Route to delete a file
storageRouter.delete("/:filename", verifyTokenFromURL, deleteFile);
storageRouter.post("/fix-protocol", async (req, res) => {
  //
  const files = await timeTrackerActivityModel.find({ webcamUrl: RegExp("httpss:", "i") });
  await Promise.all(
    files.map(async (ele) => {
      //
      const url = ele.webcamUrl.replace("httpss:", "https:");
      await timeTrackerActivityModel.findByIdAndUpdate(ele._id, {
        webcamUrl: url,
      });
    }),
  );
  res.send("ok");
});

export default storageRouter;
