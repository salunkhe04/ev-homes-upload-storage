import upcomingModel from "../model/upcoming_projects.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getupcomingProjects = async (req, res) => {
    try {
      const respPro = await upcomingModel.find();
      return res.send(
        successRes(200, "Get upcoming projects", {
          data: respPro,
        })
      );
    } catch (error) {
        return res.send(errorRes(500, `Server error: ${error?.message}`));
     
    }
  };

  //GET BY ID
export const getupcomingProjectsById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respPro = await divisionModel.findOne({ _id: id });
    if (!respPro)
      return res.send(
        successRes(404, `Department not found with id:${id}`, {
          data: respPro,
        })
      );
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};
  
  export const addupcomingProjects = async (req, res) => {
    const body = req.body;
  
    const {
     name,
     location,
     showcaseimage,
     image,
    } = body;
  
    try {
      if (!body) return res.send(errorRes(403, "Data is required"));
     
      
      // Create a new project
      const newProject = await upcomingModel.create({ ...body });
  
      await newProject.save();
  
      // Send a success response000
      return res.send(
        successRes(200, `Project added successfully: ${(name, location)}`, {
          data : newProject,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, `Server error: ${error?.message}`));
    }
  };

  export const updateupcomingProjects = async (req, res) => {
    const body = req.body;
    const id = req.params.id;
  
    const {
     name,
     location,
     showcaseimage,
     image,
    } = body; // Destructuring the body fields
  
    try {
      // Validate the necessary fields
      if (!id) return res.send(errorRes(403, "ID is required"));
      if (!body) return res.send(errorRes(403, "Data is required"));
     
      const updatedupcomingProject = await upcomingModel.findByIdAndUpdate(
        id, // Find by project ID
        { ...body },
        { new: true } // Return the updated document
      );
  
      if (!updatedupcomingProject)
        return res.send(errorRes(404, `Project not found with ID: ${id}`));
  
      // Send a success response
      return res.send(
        successRes(200, `Project updated successfully: ${name}`, {
         data: updatedupcomingProject,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, `Server error: ${error?.message}`));
    }
  };

  //DELETE PROJECTS
export const deleteupcomingProject = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Project ID is required"));
    const deleteupcomingProject = await upcomingModel.findByIdAndDelete(id);
    if (!deleteupcomingProject)
      return res.send(errorRes(404, `Project not found with ID: ${id}`));
    return res.send(
      successRes(200, `Project deleted successfully: ${deleteupcomingProject.name}`, {
        deleteupcomingProject,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};