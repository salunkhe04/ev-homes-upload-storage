import { Router } from "express";
import oneSignalModel from "../../model/oneSignal.model.js";
import { successRes } from "../../model/response.js";

const oneSignalRouter = Router();

oneSignalRouter.post("/save-player-id", async (req, res, next) => {
  const { docId, role, playerId } = req.body;

  try {
    const user = await oneSignalModel.findOne({
      docId,
      role,
    });

    if (user) {
      await user.updateOne(
        {
          playerId: playerId,
        },
        { new: true }
      );
      return res.send(successRes(200, "Player ID saved", user));
    }
    const oneSignal = new oneSignalModel({
      docId,
      role,
      playerId,
    });

    await oneSignal.save();
    return res.send(successRes(200, "Player ID saved", oneSignal));
  } catch (error) {
    return next(error);
  }
});

export default oneSignalRouter;
