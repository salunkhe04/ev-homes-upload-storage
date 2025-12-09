import express from "express";
import { errorRes, successRes2, successRes } from "../../model/response.js";
import approvalStepModel from "../../model/approvalStep.model.js";
import { approvalStepPopulations } from "../../utils/constant.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const approvalStepRouter = express.Router();

approvalStepRouter.post(
  "/approval-step-add",
  authenticateToken,
  async (req, res) => {
    try {
      const { requestType, steps } = req.body;
      const newConfig = new approvalStepModel({
        requestType,
        steps: steps && steps.length > 0 ? steps : [{ role: "reportingTo" }],
      });
      await newConfig.save();
      return successRes2(res, 200, "Approval config added", {
        data: newConfig,
      });
      // res.json({ message: "Approval config added", data: newConfig });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

approvalStepRouter.get(
  "/approval-step",
  authenticateToken,
  async (req, res) => {
    try {
      const configs = await approvalStepModel
        .find()
        .populate(approvalStepPopulations);
      return successRes2(res, 200, "Approval config list", { data: configs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

approvalStepRouter.delete(
  "/approval-step-delete/:id",
  authenticateToken,
  async (req, res) => {
    const id = req.params.id;

    try {
      if (!id) return res.send(errorRes(403, "Step ID is required"));

      const deleteStep = await approvalStepModel.findByIdAndDelete(id);

      if (!deleteStep)
        return res.send(errorRes(404, `Step not found with ID: ${id}`));

      return res.send(
        successRes(200, `Step deleted successfully: ${deleteStep.steps}`, {
          deleteStep,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, `Server error: ${error?.message}`));
    }
  }
);

approvalStepRouter.post(
  "/approval-step-update/:id",
  authenticateToken,
  async (req, res) => {
    const body = req.body;
    const id = req.params.id;

    const { requestType, steps } = body; // Destructuring the body fields

    try {
      // Validate the necessary fields
      if (!id) return res.send(errorRes(403, "ID is required"));
      if (!body) return res.send(errorRes(403, "Data is required"));

      const updatedstep = await approvalStepModel.findByIdAndUpdate(
        id, // Find by project ID
        { ...body },
        { new: true } // Return the updated document
      );

      if (!updatedstep)
        return res.send(errorRes(404, `Step not found with ID: ${id}`));

      // Send a success response
      return res.send(
        successRes(200, `Step updated successfully: ${requestType}`, {
          data: updatedstep,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, `Server error: ${error?.message}`));
    }
  }
);

export default approvalStepRouter;
