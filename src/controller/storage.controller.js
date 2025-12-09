import jwt from "jsonwebtoken";
import storageModel from "../model/storage.model.js";
import config from "../config/config.js";
import path from "path";
import { errorRes, successRes } from "../model/response.js";
import { uploadsDir } from "../routes/storage/storageRouter.js";
import fs from "fs";

export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  try {
    const uniqueFileName = req.file.filename;
    const token = jwt.sign(
      { filename: uniqueFileName },
      config.SECRET_STORAGE_KEY
    );

    //   console.log(`Uploaded file: ${req.file}`);
    //   console.log(req.file);
    //   console.log(`Token: ${token}`);
    let downloadUrl = `${req.protocol}s://${req.get("host")}`;
    if (req.query.path) {
      downloadUrl += `/${req.query.path}`;
    }
    downloadUrl += `/${uniqueFileName}?token=${token}`;

    if (downloadUrl.includes("api.")) {
      downloadUrl = downloadUrl.replace("api.", "cdn.");
    }

    const respDb = new storageModel({
      ...req.file,
      downloadUrl,
      token: token,
    });

    await respDb.save();
    // console.log(downloadUrl);
    res.json({
      message: "File uploaded successfully!",
      token,
      filename: uniqueFileName,
      downloadUrl: downloadUrl,
    });
  } catch (error) {
    // console.log(error);

    res.json({
      message: error,
    });
  }
};

export const uploadMultiple = async (req, res) => {
  const uplaodedFiles = [];
  if (!req.files || req.files.length === 0) {
    return res.send(errorRes(400, "No files uploaded."));
  }

  if (req.files.length > 10) {
    return res.send(errorRes(400, "Only 10 file upload allowed at once"));
  }

  const fileDetails = req.files.map(async (file) => {
    const uniqueFileName = file.filename;

    const token = jwt.sign(
      { filename: file.filename },
      config.SECRET_STORAGE_KEY
    );
    // let downloadUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/${uniqueFileName}?token=${token}`;

    let downloadUrl = `${req.protocol}s://${req.get("host")}`;
    if (req.query.path) {
      downloadUrl += `/${req.query.path}`;
    }
    downloadUrl += `/${uniqueFileName}?token=${token}`;

    if (downloadUrl.includes("api.")) {
      downloadUrl = downloadUrl.replace("api.", "cdn.");
    }

    const respDb = new storageModel({
      ...file,
      downloadUrl,
      token: token,
    });

    await respDb.save();
    uplaodedFiles.push({
      ...file,
      filename: uniqueFileName,
      token,
      downloadUrl,
    });
    return { filename: uniqueFileName, token, downloadUrl };
  });

  await Promise.all(fileDetails);

  // console.log(uplaodedFiles);
  return res.send(
    successRes(200, "Files uploaded successfully!", { data: uplaodedFiles })
  );
};
export const getFileLink = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      //   console.error(err);
      res.send(errorRes(404, "File not found"));
    }
  });
};

export const deleteFile = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  // Delete the file
  fs.unlink(filePath, async (err) => {
    if (err) {
      console.error(err);
      return res.send(errorRes(404, "File not found"));
    }
    await storageModel.findOneAndDelete({ filename: filename });
    res.json({ message: "File deleted successfully!" });
  });
};
