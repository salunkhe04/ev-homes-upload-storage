import { RedisService } from "../app/redis.js";
import ourProjectModel from "../model/ourProjects.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";

//GET BY ALL
export const getOurProjects = async (req, res) => {
  try {
    // console.log("ok");
    const cached = await RedisService.get("projects", true);

    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get projects - cached", {
          data: cached,
        })
      );
    }

    const respPro = await ourProjectModel.find(
      {},
      { flatList: 0, parkingList: 0 }
    );
    const cacheNew = await RedisService.set("projects", respPro, 86400); // 24 hr cache

    return res.send(
      successRes(200, "Get our projects", {
        data: respPro,
      })
    );
  } catch (error) {
    return res.json({
      message: `error:${error}`,
    });
  }
};

// export const getProjectLocationLinks = async (req, res) => {
//   try {
//     const locationLinks = await ourProjectModel.find({}, { locationLink: 1, _id: 0 }); // Only fetch 'locationLink' field

//     return res.send(
//       successRes(200, "Fetched location links successfully", {
//         data: locationLinks,
//       })
//     );
//   } catch (error) {
//     return res.json({
//       message: `Error: ${error.message}`,
//     });
//   }
// };

//GET BY ID
export const getProjectsById = async (req, res) => {
  const id = req.params.id;
  try {
    // const cached = await RedisService.get("projects", true);

    // if (cached != null) {
    //
    //   return res.send(
    //     successRes(200, "Get projects - cached", {
    //       data: cached,
    //     })
    //   );
    // }

    if (!id) return res.send(errorRes(403, "id is required"));

    const respPro = await ourProjectModel.findById(id);

    if (!respPro) {
      return res.send(errorRes(404, `Project  not found with id:${id}`));
    }
    // const cacheNew = await RedisService.set("projects", respPro, 86400); // 24 hr cache

    return res.send(successRes(200, "project by id", { data: respPro }));
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

export const getFlatListByProject = async (req, res) => {
  const id = req.params.id;
  try {
    const cached = await RedisService.get("projects", true);

    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get projects - cached", {
          data: cached,
        })
      );
    }

    if (!id) {
      return res
        .status(403)
        .json({ success: false, message: "ID is required" });
    }

    const respPro = await ourProjectModel.findOne({ _id: id });

    if (!respPro) {
      return res.json({
        success: false,
        message: `Project not found with id: ${id}`,
      });
    }
    const cacheNew = await RedisService.set("projects", respPro, 86400); // 24 hr cache

    return res.json({
      success: true,
      message: "FlatList retrieved successfully",
      data: respPro.flatList,
    });
  } catch (error) {
    // Handle server errors
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
};

//ADD PROJECTS
export const addProjects = async (req, res) => {
  const body = req.body;

  const {
    amenities,
    configurations,
    contactNumber,
    countryCode,
    description,
    locationLink,
    locationName,
    name,
    brochure,
    showCaseImage,
  } = body;

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));
    // if (!amenities || amenities.length === 0)
    //   return res.send(errorRes(403, "Amenities are required"));
    // if (!configurations || configurations.length === 0)
    //   return res.send(errorRes(403, "configurations is required"));
    // if (!contactNumber)
    //   return res.send(errorRes(403, "Contact number is required"));
    // if (!description) return res.send(errorRes(403, "Description is required"));
    // if (!locationLink)
    //   return res.send(errorRes(403, "Location link is required"));
    if (!locationName)
      return res.send(errorRes(403, "Location name is required"));
    if (!name) return res.send(errorRes(403, "Project name is required"));
    if (!showCaseImage)
      return res.send(errorRes(403, "Showcase image is required"));
    const year = new Date().getFullYear();

    body._id = `project-${name
      ?.replace(/\s+/g, "-")
      .toLowerCase()}-${locationName
      ?.replace(/\s+/g, "-")
      .toLowerCase()}-${year}`;
    // Create a new project
    const newProject = await ourProjectModel.create({ ...body });

    await newProject.save();

    const cached = await RedisService.del("projects");

    // Send a success response000
    return res.send(
      successRes(200, `Project added successfully: ${(name, locationName)}`, {
        newProject,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

//UPDATE PROJECTS
export const updateProjects = async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const {
    amenities,
    bhkConfiguration,
    contactNumber,
    countryCode,
    description,
    locationLink,
    locationName,
    name,
    brochure,
    showCaseImage,
  } = body; // Destructuring the body fields

  try {
    // Validate the necessary fields
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));
    // if (!amenities || amenities.length === 0)
    //   return res.send(errorRes(403, "Amenities are required"));
    // if (!bhkConfiguration || bhkConfiguration.length === 0)
    //   return res.send(errorRes(403, "BhkList is required"));
    // if (!contactNumber)
    //   return res.send(errorRes(403, "Contact number is required"));
    // if (!description) return res.send(errorRes(403, "Description is required"));
    // if (!locationLink)
    //   return res.send(errorRes(403, "Location link is required"));
    // if (!locationName)
    //   return res.send(errorRes(403, "Location name is required"));
    // if (!name) return res.send(errorRes(403, "Project name is required"));
    // if (!showCaseImage)
    //   return res.send(errorRes(403, "Showcase image is required"));

    // Perform the update

    // console.log(body);
    const updatedProject = await ourProjectModel.findByIdAndUpdate(
      id, // Find by project ID
      { ...body },
      { new: true } // Return the updated document
    );

    if (!updatedProject)
      return res.send(errorRes(404, `Project not found with ID: ${id}`));

    const cached = await RedisService.del("projects");

    // Send a success responses
    return res.send(
      successRes(200, `Project updated successfully: ${name}`, {
        updatedProject,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const updateFlatInProject = async (req, res) => {
  const { id } = req.params;
  const { id: flatId, buildingNo, floor, number } = req.body;

  try {
    // Perform the update
    let resp = await ourProjectModel.findById(id);
    if (!resp) return errorRes2(res, 404, "no project found");

    const foundFlat = resp.flatList.find(
      (ele) =>
        (ele.buildingNo == buildingNo &&
          ele.floor === floor &&
          ele.number === number) ||
        ele._id === flatId
    );
    // add new flat if dont exist
    if (!foundFlat) {
      // add new flat
      resp = await ourProjectModel.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            flatList: {
              ...req.body,
            },
          },
        },
        { new: true }
      );
      const updateProj = await ourProjectModel.findById(id);

      return res.send(
        successRes(200, "Flat Added successfully", {
          data: updateProj,
        })
      );
    }
    const updateFields = {};
    for (const key in req.body) {
      updateFields[`flatList.$.${key}`] = req.body[key];
    }

    // Perform the update
    resp = await ourProjectModel.updateOne(
      {
        _id: id,
        "flatList._id": flatId,
      },
      { $set: updateFields },
      { new: true }
    );
    const updateProj = await ourProjectModel.findById(id);

    const cached = await RedisService.del("projects");

    return res.send(
      successRes(200, "Flat updated successfully", {
        data: updateProj,
      })
    );
  } catch (err) {
    console.log(err);
    return res.send(errorRes(500, "Server error"));
  }
};
export const deleteFlatInProject = async (req, res) => {
  const { id } = req.params;
  const { id: flatId } = req.body;

  try {
    // Perform the update
    let resp = await ourProjectModel.findById(id);
    if (!resp) return errorRes2(res, 404, "no project found");

    const foundFlat = resp.flatList.find(
      (ele) => ele._id?.toString() === flatId
    );

    // add new flat if dont exist
    if (!foundFlat) {
      return errorRes2(res, 404, "no flat found");
    }
    const updateFields = {};
    for (const key in req.body) {
      updateFields[`flatList.$.${key}`] = req.body[key];
    }

    // Perform the update
    resp = await ourProjectModel.findByIdAndUpdate(
      id,
      {
        $pull: {
          flatList: {
            _id: flatId,
          },
        },
      },
      { new: true }
    );

    const updateProj = await ourProjectModel.findById(id);
    const cached = await RedisService.del("projects");

    return res.send(
      successRes(200, "Flat updated successfully", {
        data: updateProj,
      })
    );
  } catch (err) {
    console.log(err);
    return res.send(errorRes(500, "Server error"));
  }
};

//DELETE PROJECTS
export const deleteProject = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Project ID is required"));
    const deletedProject = await ourProjectModel.findByIdAndDelete(id);
    if (!deletedProject)
      return res.send(errorRes(404, `Project not found with ID: ${id}`));

    const cached = await RedisService.del("projects");

    return res.send(
      successRes(200, `Project deleted successfully: ${deletedProject.name}`, {
        deletedProject,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const searchProjects = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let skip = (page - 1) * limit;

    let searchFilter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
      ],
    };

    const respProject = await ourProjectModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .select("");

    // Count the total items matching the filter
    const totalItems = await ourProjectModel.countDocuments(searchFilter);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get Projects", {
        page,
        limit,
        totalPages,
        totalItems,
        items: respProject,
      })
    );
  } catch (error) {
    return next(error);
  }
};
export const updateFlatDetails = async (req, res) => {
  const { projectId, flatNo, updates } = req.body;

  try {
    if (!projectId) return res.send(errorRes(401, "Project ID required"));
    if (!flatNo) return res.send(errorRes(401, "Flat No required"));
    if (!updates) return res.send(errorRes(401, "Data required"));

    // Check if the update includes a cancellation
    if (updates.status === "canceled") {
      updates.available = true; // Set the flat as available for booking
    }

    // Construct the dynamic $set query
    const updateFields = {};
    for (const key in updates) {
      updateFields[`flatList.$.${key}`] = updates[key];
    }

    // Perform the update
    const resp = await ourProjectModel.updateOne(
      { _id: projectId, "flatList.flatNo": flatNo }, // Match project and specific flat
      { $set: updateFields }, // Dynamically update fields
      { upsert: true }
    );

    const cached = await RedisService.del("projects");

    return res.send(
      successRes(200, "Flat updated successfully", {
        data: resp,
      })
    );
  } catch (err) {
    return res.send(errorRes(500, "Server error"));
  }
};

export const updateFlatInfoByIdFlatNo = async ({
  projectId,
  buildingNo,
  floor,
  number,
  updates,
}) => {
  try {
    // Build $set using arrayFilters
    const updateFields = {};
    for (const key in updates) {
      updateFields[`flatList.$[elem].${key}`] = updates[key];
    }

    const resp = await ourProjectModel.updateOne(
      { _id: projectId }, // match the project only
      { $set: updateFields },
      {
        arrayFilters: [
          {
            "elem.buildingNo": buildingNo,
            "elem.floor": floor,
            "elem.number": number,
          },
        ],
      }
    );

    console.log(resp); // check matchedCount and modifiedCount

    if (resp.modifiedCount === 0) {
      return false; // no documents updated
    }

    await RedisService.del("projects");
    return true;
  } catch (error) {
    console.error("Error updating flat info:", error);
    return false;
  }
};

export const getShortsForClient = async (req, res, next) => {
  const id = req.params.id;
  try {
    //
    const resp = await ourProjectModel.findById(id);
  } catch (error) {
    //
  }
};

export const updateAllInclusiveFromCSV = async (req, res) => {
  const { id } = req.params; // projectId

  try {
    if (!req.file) return res.send(errorRes(400, "CSV file is required"));

    const project = await ourProjectModel.findById(id);
    if (!project) return res.send(errorRes(404, "No project found"));

    const rows = [];

    // Parse CSV
    // const stream = Readable.from(req.file.buffer);
    // await new Promise((resolve, reject) => {
    //   stream
    //     .pipe(csvParser())
    //     .on("data", (data) => rows.push(data))
    //     .on("end", resolve)
    //     .on("error", reject);
    // });

    let countUpdated = 0;

    rows.forEach((row) => {
      const flat = project.flatList.find(
        (ele) => ele.number?.toString().trim() === row.flatNo?.toString().trim()
      );
      if (flat) {
        flat.allInclusiveValue = Number(row.allInclusiveValue);
        countUpdated++;
      }
    });

    await project.save();

    return res.send(
      successRes(200, "All-Inclusive values updated successfully", {
        totalRows: rows.length,
        totalUpdated: countUpdated,
      })
    );
  } catch (err) {
    console.log(err);
    return res.send(errorRes(500, "Server error"));
  }
};

// TODO:old
// export const updateFlatInfoByIdFlatNo = async ({
//   projectId,
//   buildingNo,
//   floor,
//   number,
//   updates,
// }) => {
//   try {
//     // Construct the dynamic $set query
//     const updateFields = {};
//     for (const key in updates) {
//       updateFields[`flatList.$.${key}`] = updates[key];
//     }

//     // Perform the update
//     const resp = await ourProjectModel.updateOne(
//       {
//         _id: projectId,
//         "flatList.number": number,
//         "flatList.floor": floor,
//         "flatList.buildingNo": buildingNo,
//       }, // Match project and specific flat
//       { $set: updateFields } // Dynamically update fields
//     );

//     // Check if any documents were modified
//     if (resp.modifiedCount === 0) {
//       // console.log(
//       //   `No flat found with flatNo: ${flatNo} in project: ${projectId}`
//       // );
//       return false; // No documents were updated
//     }

//     const cached = await RedisService.del("projects");

//     return true; // Update was successful
//   } catch (error) {
//     console.error("Error updating flat info:", error); // Log the error
//     return false; // Indicate failure
//   }
// };

export const updatCarpetArea = async (req, res) => {
  console.log("passed 1");
  const id = req.params.id;

  if (!id) return errorRes2(res, 400, "id is required");

  try {
    const project = await ourProjectModel.findById(id);

    if (!project) return errorRes2(res, 400, "No project found");

    // Update each flat's sellableCarpetArea
    project.flatList = project.flatList.map((flat) => {
      const original = Number(flat.sellableCarpetArea);
      flat.carpetArea = original / 2; // update value
      return flat;
    });

    // Save updated project to database
    await project.save();

    return successRes2(res, 200, "carpet area updated successfully", {
      data: project.flatList,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
