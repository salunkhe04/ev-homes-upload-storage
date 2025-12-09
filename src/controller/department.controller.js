import departmentModel from "../model/department.model.js";
import { errorRes, successRes } from "../model/response.js";

//GET BY ALL
export const getDepartment = async (req, res) => {
  try {
    const respDept = await departmentModel.find();

    return res.send(
      successRes(200, "Get Department", {
        data: respDept,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//GET BY ID
export const getDepartmentById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDept = await departmentModel.findOne({ _id: id });

    if (!respDept)
      return res.send(
        successRes(404, `Department not found`, {
          data: respDept,
        })
      );

    return res.send(
      successRes(200, "Department found", {
        data: respDept,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//add department
export const addDepartment = async (req, res) => {
  const body = req.body;
  const { department } = body;

  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!department) return res.send(errorRes(403, "department is required"));
    const newDeptId = "dept-" + department?.replace(/\s+/g, "-").toLowerCase();

    const newDepartment = await departmentModel.create({
      _id: newDeptId,
      department: department,
    });
    await newDepartment.save();
    return res.send(
      successRes(200, `department added successfully: ${department}`, {
        data: newDepartment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//update department
export const updateDepartment = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const { department } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!department) return res.send(errorRes(403, "department is required"));
    const updatedDepartment = await departmentModel.findByIdAndUpdate(
      id,
      { department },
      { new: true }
    );
    if (!updateDepartment)
      return res.send(errorRes(402, `department not updated: ${department}`));
    return res.send(
      successRes(200, `department updated successfully: ${department}`, {
        data: updatedDepartment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//delete department
export const deleteDepartment = async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const { department } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "data is required"));

    const deletedDepartment = await departmentModel.findByIdAndDelete(id);

    if (!deleteDepartment)
      return res.send(errorRes(402, `department not deleted: ${department}`));

    return res.send(
      successRes(200, `department deleted successfully`, {
        deletedDepartment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
