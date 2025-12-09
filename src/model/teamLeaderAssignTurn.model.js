import mongoose from "mongoose";
import employeeModel from "./employee.model.js";

// Your schema
const teamLeaderAssignTurnSchema = new mongoose.Schema(
  {
    lastAssignTeamLeader: {
      type: String,
      ref: "employees",
      default: null,
    },
    nextAssignTeamLeader: {
      type: String,
      ref: "employees",
      default: null,
    },
    listOfTeamLeaders: [
      String,
      // {
      //   teamLeader: {
      //     type: String,
      //     ref: "employees",
      //   },
      //   order: {
      //     type: Number,
      //     required: true,
      //   },
      // },
    ],
    currentOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, timeseries: true }
);

// Static method to add all team leaders from employees
// teamLeaderAssignTurnSchema.statics.addMissingTeamLeaders = async function () {
//   const assignTurn = await this.findOne(); // Assuming there's only one document

//   // if (!assignTurn) throw new Error("No assignment turn found.");

//   // Get all employees (team leaders)
//   const allTeamLeaders = await employeeModel.find({
//     designation: "desg-pre-sales-team-leader",
//   }); // Fetch all employees who are team leaders

//   // Get current team leaders already in the list
//   const existingTeamLeaderIds = assignTurn.listOfTeamLeaders.map(
//     (tl) => tl.teamLeader
//   );

//   // Filter out team leaders not already in listOfTeamLeaders
//   const newTeamLeaders = allTeamLeaders.filter(
//     (employee) => !existingTeamLeaderIds.includes(employee._id)
//   );

//   // Determine the next order to assign
//   let nextOrder = assignTurn.listOfTeamLeaders.length
//     ? Math.max(...assignTurn.listOfTeamLeaders.map((tl) => tl.order)) + 1
//     : 1;

//   // Add new team leaders with proper order
//   newTeamLeaders.forEach((newLeader) => {
//     assignTurn.listOfTeamLeaders.push({
//       teamLeader: newLeader._id,
//       order: nextOrder,
//     });
//     nextOrder++;
//   });

//   await assignTurn.save();
//   return assignTurn;
// };
// teamLeaderAssignTurnSchema.methods.getNextTeamLeader = async function () {
//   const totalLeaders = this.listOfTeamLeaders.length;

//   if (totalLeaders === 0) {
//     throw new Error("No team leaders available");
//   }

//   // Calculate the next order (circular rotation)
//   const nextOrder = (this.currentOrder + 1) % totalLeaders;

//   // Find the next leader based on the calculated order
//   const nextLeader = this.listOfTeamLeaders.find(
//     (leader) => leader.order === nextOrder
//   );

//   if (!nextLeader) {
//     throw new Error("Next leader not found");
//   }

//   // Update the last and next assigned team leaders
//   this.lastAssignTeamLeader = this.nextAssignTeamLeader;
//   this.nextAssignTeamLeader = nextLeader.teamLeader;

//   // Update the current order to reflect the next leader's order
//   this.currentOrder = nextOrder;

//   // Save the updated document
//   await this.save();

//   // Return the relevant info about the last and next assigned leaders
//   return {
//     lastAssignTeamLeader: this.lastAssignTeamLeader,
//     nextAssignTeamLeader: this.nextAssignTeamLeader,
//   };
// };

const TeamLeaderAssignTurn = mongoose.model(
  "TeamLeaderAssignTurn",
  teamLeaderAssignTurnSchema
);

export default TeamLeaderAssignTurn;

// import mongoose from "mongoose";

// const teamLeaderAssignTurnSchema = new mongoose.Schema(
//   {
//     lastAssignTeamLeader: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "employees",
//       default: null,
//     },
//     nextAssignTeamLeader: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "employees",
//       default: null,
//     },
//     listOfTeamLeaders: [
//       {
//         teamLeader: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "employees",
//         },
//         order: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],
//     currentOrder: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// // Add a method to get and update the next team leader

// const TeamLeaderAssignTurnModel = mongoose.model(
//   "teamLeaderAssignTurn",
//   teamLeaderAssignTurnSchema,
//   "teamLeaderAssignTurn"
// );

// export default TeamLeaderAssignTurnModel;
// // export const teamLeaderAssignTurnSchema = new mongoose.Schema(
// //   {
// //     lastAssignTeamLeader: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "employees",
// //       default: null,
// //     },
// //     nextAssignTeamLeader: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "employees",
// //       default: null,
// //     },
// //     listOfTeamLeaders: [
// //       {
// //         type: mongoose.Schema.Types.ObjectId,
// //         ref: "employees",
// //         default: null,
// //       },
// //     ],
// //   },
// //   { timestamps: true }
// // );

// // const teamLeaderAssignTurnModel = mongoose.model(
// //   "teamLeaderAssignTurn",
// //   teamLeaderAssignTurnSchema,
// //   "teamLeaderAssignTurn"
// // );
// // export default teamLeaderAssignTurnModel;
