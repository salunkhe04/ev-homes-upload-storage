import { Router } from "express";
// import questionModel from "../../model/exam/question.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import logger from "../../utils/logger.js";

const questionRouter = Router();

questionRouter.get("/questions", async (req, res) => {
  try {
    //
    const foundQue = await questionModel.find();

    return successRes2(res, 200, "questions", { data: foundQue });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal server error");
  }
});

questionRouter.post("/create-questions", async (req, res) => {
  const { title } = req.body;
  try {
    if (!title) return errorRes2(res, 401, "title required");
    const newId = title?.replace(/\s+/g, "-").toLowerCase();

    const newQues = await questionModel.create({
      ...req.body,
      _id: newId,
    });

    return successRes2(res, 200, "questions", { data: newQues });
  } catch (error) {
    //
    logger.error(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

questionRouter.post("/update-question/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    if (!id) return errorRes2(res, 401, "id required");
    const foundQue = await questionModel.findById(id);
    if (!foundQue)
      return errorRes2(res, 401, "question your looking for not found1");

    const newQues = await questionModel.findByIdAndUpdate(id, {
      ...req.body,
    });

    return successRes2(res, 200, "questions", { data: newQues });
  } catch (error) {
    //
    logger.info(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

questionRouter.post("/add-questions/:id", async (req, res) => {
  const { id } = req.params;
  const { questions } = req.body;
  try {
    if (!id) return errorRes2(res, 401, "title required");
    if (!questions) return errorRes2(res, 401, "questions required");

    const foundQue = await questionModel.findById(id);

    if (!foundQue) return errorRes2(res, 401, "no question found");

    let newQuest = questions.map((ele) => {
      ele.title = foundQue?.title;
      return ele;
    });

    const newQues = await questionModel.findByIdAndUpdate(
      id,
      {
        questions: newQuest,
      },
      { new: true }
    );

    return successRes2(res, 200, "questions", { data: newQues });
  } catch (error) {
    //
    logger.info(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

export default questionRouter;
