import appDevModel from "../model/appDevTask.model.js";
import { errorRes, successRes } from "../model/response.js";
import { appDevTaskPopulateOption } from "../utils/constant.js";

export const getAppDevTask = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let skip = (page - 1) * limit;
    const totalItems = await appDevModel.countDocuments();
    const appDev = await appDevModel
      .find()
      .skip(skip)
      .limit(limit)
      .populate(appDevTaskPopulateOption);
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Task Fetched Successfully!", {
        page,
        limit,
        totalItems,
        totalPages,
        data: appDev,
      })
    );
  } catch (e) {
    res.send(errorRes, (500, `Server Error $e`));
  }
};

export const getAppDevTaskById = async (req, res, next) => {
  const id = req.params.id;

  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    const totalItems = await appDevModel.countDocuments(id);
  
    const appDev = await appDevModel
      .findById(id)

      .populate(appDevTaskPopulateOption);
      const totalPages = Math.ceil(totalItems / limit);


    return res.send(200, "Task Fetched Successfully for you!", {
      page,
      limit,
      totalItems,
      totalPages,
      data: appDev,
    });
  } catch (e) {
    res.send(errorRes, (500, `Server Error $e`));
  }
};

export const addAppDevTask = async (req, res) => {
  const body = req.body;
  const assignTo = req.params.id;

  try {
    if (!assignTo)
      return res.send(errorRes(401, "assign to assignTo required"));

    if (!body) return res.send(errorRes(403, "body is required"));

    const newData = {
      ...body,
      assignTo: assignTo,
    };

    // console.log(body);
    const newAppDev = await appDevModel.create({
      ...newData,
    });

    await newAppDev.save();

    return res.send(
      successRes(200, `Task created successfully`, {
        data: newAppDev,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getTaskByAssignTo = async (req, res, next) => {
  const id = req.params.id;
  try {
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let skip = (page - 1) * limit;
    const totalItems = await appDevModel.countDocuments({ assignTo: id });
    const newApp = await appDevModel
      .find({ assignTo: id })
      .skip(skip)
      .limit(limit)
      .populate(appDevTaskPopulateOption);
    const totalPages = Math.ceil(totalItems / limit);
    return res.send(
      successRes(200, "Task Fetched ", {
        page,
        limit,
        totalItems,
        totalPages,
        data: newApp,
      })
    );
  } catch (e) {
    return res.send(errorRes(500, "Server Error"));
  }
};


export const updateTaskFeedback =async(req,res,next)=>{
const id= req.params.id;
try{

  if(!id)return res.send(errorRes(400,"id is required"));

  const updateData = req.body;

  const updatedTask = await appDevModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true } 
  );

  if (!updatedTask) {
    return res.send(errorRes(404, "Task not found"));
  }

  return res.send(successRes(200, "Task updated successfully", updatedTask));



}catch(e){
  return res.send(errorRes(500,`Server Error $e`));
}


};