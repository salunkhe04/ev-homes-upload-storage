import estModel from "../model/estimator.model.js";
import { errorRes, successRes } from "../model/response.js";

// Create a new estimate
export const createEstimate = async (req, res) => {
  try {
    const { teamLeader } = req.body;

    // Validate input
    if (!teamLeader) {
      return res.json({ message: "Team leader is required" });
    }
    // Find the last estimate for the same team leader
    const lastEstimate = await estModel.findOneAndUpdate(
      { teamLeader },
      { $inc: { count: 1 } }, // Increment the count by 1
      { new: true, upsert: true }
    );

    // const newCount = lastEstimate ? lastEstimate.count + 1 : 1;

    // // Create and save new estimate
    // const estimate = await estModel.create({
    //   teamLeader,
    //   count: newCount
    // });

    // Create the estimate with the new count
    // const estimate = new estModel({
    //   teamLeader,
    //   count: newCount,
    // });

    // Save the estimate to the database
    await lastEstimate.save();

    return res.send(
      successRes(200, "Estimate added ", {
        data: lastEstimate,
      })
    );
  } catch (error) {
    console.error("Error creating estimate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEstimatesByTeamLeader = async (req, res) => {
  try {
    const teamLeader = req.params.id;

    // Find all estimates for the team leader
    const estimates = await estModel
      .findOne({ teamLeader })
      .populate({ path: "teamLeader", select: "firstName lastName" });

    // Check if estimates were found
    // if (!estimates) {
    //   return res
    //
    //     .json({ message: "No estimates found for this team leader." });
    // }

    return res.send(
      successRes(200, "Get EstId", {
        data: estimates,
      })
    );
  } catch (error) {
    console.error("Error fetching estimates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const creatEst = async (req, res) => {
//   try {
//     const { teamLeader,count,startDate} = req.body;

//     // // Validate input
//     // if (!name || !teamLeaderId) {
//     //   return res.json({ message: 'Name and teamLeaderId are required' });
//     // }

//     // Create the estimator
//     const estimator = new estModel({
//       teamLeader,
//       count,
//       generatedDate,
//       financialYear

//     });

//     // Save the estimator to the database
//     await estimator.save();

//     return res.send(
//         successRes(200, "Get EstId", {
//           data: estimator,
//         })
//       );
//   } catch (error) {
//     console.error("Error fetching coupon:", error);
//     return res.send(errorRes(500, error.message || "Server error"));
//   }
// };

// // Get all estimators
// // export const getAllEstimators = async (req, res) =>  {
// //   try {
// //     const estimators = await Estimator.find().populate('teamLeaderId', 'name email'); // Populate team leader details
// //     res.json(estimators);
// //   } catch (error) {
// //     console.error('Error fetching estimators:', error);
// //     res.status(500).json({ message: 'Internal server error' });
// //   }
// // };

// // Get estimator by ID
// exports.getEstimatorById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const estimator = await Estimator.findById(id).populate('teamLeaderId', 'name email');
//     if (!estimator) {
//       return res.json({ message: 'Estimator not found' });
//     }
//     res.json(estimator);
//   } catch (error) {
//     console.error('Error fetching estimator:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


export const updateTeamLeaderCount = async (req, res) => {
  try {
    const teamLeader = req.params.id;

    // Find all estimates for the team leader
    const estimates = await estModel
      .findOneAndUpdate({ teamLeader })
      .populate({ path: "teamLeader", select: "firstName lastName" });

    // Check if estimates were found
    // if (!estimates) {
    //   return res
    //
    //     .json({ message: "No estimates found for this team leader." });
    // }

    return res.send(
      successRes(200, "Get EstId", {
        data: estimates,
      })
    );
  } catch (error) {
    console.error("Error fetching estimates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};