import { Router } from "express";
import {
  addGeneratedEstimate,
  getEstimatedById,
  getEstimateGenerated,
  getEstimateGeneratedByEstId,
  getEstimateGeneratedById,
  getEstimateGeneratedMultiple,
  updateEstimateGeneratedById,
  updateEstimateGeneratedByIdArray,
  updateHandoverRevoke,
} from "../../controller/estimateGenerated.controller.js";
import estimateGeneratedModel from "../../model/estimateGenerate.model.js";

import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";
import ourProjectModel from "../../model/ourProjects.model.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const estimateGeneratedRouter = Router();
estimateGeneratedRouter.get(
  "/estimates",
  authenticateToken,
  getEstimateGenerated
);
estimateGeneratedRouter.post(
  "/estimateGenerated-add",
  authenticateToken,
  addGeneratedEstimate
);
estimateGeneratedRouter.get(
  "/estimateGenerated-lead/:id",
  authenticateToken,
  getEstimateGeneratedById
);
estimateGeneratedRouter.get(
  "/estimate-id/:id",
  authenticateToken,
  getEstimatedById
);
estimateGeneratedRouter.get(
  "/estimateGenerated-est-id/:id",
  authenticateToken,
  getEstimateGeneratedByEstId
);
estimateGeneratedRouter.post(
  "/update-estimateGenerated/:id",
  authenticateToken,
  updateEstimateGeneratedById
);

estimateGeneratedRouter.post(
  "/update-estimateGenerated-array/:id",
  authenticateToken,
  updateEstimateGeneratedByIdArray
);

estimateGeneratedRouter.get(
  "/estimateGenerated-list/:id",
  authenticateToken,
  getEstimateGeneratedMultiple
);

estimateGeneratedRouter.post(
  "/estimate-update-status/:id",
  authenticateToken,
  updateHandoverRevoke
);

estimateGeneratedRouter.post("/update-flat/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    // Step 1: Get all estimate docs for the project
    const estimateDocs = await estimateGeneratedModel.find({
      project: projectId,
    });

    if (!estimateDocs.length) {
      return res
        .status(404)
        .json({ error: "No estimates found for this project" });
    }

    const ourProject = await ourProjectModel.findById(projectId);

    if (!ourProject || !Array.isArray(ourProject.flatList)) {
      return res
        .status(404)
        .json({ error: "No flatList found in ourProjectModel" });
    }

    let updatedCount = 0;
    const unmatchedFlats = [];

    // Step 3: Update each estimate document
    for (const doc of estimateDocs) {
      const flatNo = doc.flatNo;

      // Match using `flat` field from ourProject's flatList
      const match = ourProject.flatList.find((f) => f.flatNo === flatNo);

      if (match) {
        doc.floor = match.floor;
        doc.number = match.number;
        doc.buildingNo = match.buildingNo ?? null;
        await doc.save();
        updatedCount++;
      } else {
        unmatchedFlats.push(flatNo);
      }
    }

    res.status(200).json({
      message: `Updated ${updatedCount} documents.`,
      unmatchedFlats: unmatchedFlats.length ? unmatchedFlats : undefined,
    });
  } catch (error) {
    console.error("Error updating documents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

estimateGeneratedRouter.post(
  "/project-updates-flat-fix-bldg",
  async (req, res) => {
    try {
      const resp2 = await ourProjectModel.findOne({
        _id: "project-ev-9-square-vashi-sector-9",
      });

      if (!resp2) {
        return res.json({ message: "Project not found" });
      }

      // ✅ Correctly update each flat's `buildingNo`
      resp2.flatList.forEach((flat) => {
        flat.buildingNo = null;
      });

      // ✅ Save the updated document
      await resp2.save();

      res.json({ message: "Building numbers updated", data: resp2 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default estimateGeneratedRouter;
