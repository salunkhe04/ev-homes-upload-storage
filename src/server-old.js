// import express from "express";
// import cors from "cors";
// import "dotenv/config";
// import config from "./config/config.js";
// import connectDatabase from "./config/database.js";
// import router from "./routes/router.js";
// import { errorHandler, notFound } from "./middleware/errorHandler.js";
// import { hostnameCheck } from "./utils/helper.js";
// import cron from "node-cron";
// import axios from "axios";
// import triggerHistoryModel from "./model/triggerLog.model.js";
// import {
//   getlast24HrNotAssignedLeads,
//   getlast24HrNotFeedbackLeads,
//   triggerCycleChangeFunction,
//   triggerCycleChangeFunctionFix,
// } from "./controller/lead.controller.js";
// import { Server } from "socket.io";
// import http from "http";
// import TransportModel from "./model/transport.model.js";
// import { insertDailyAttendance } from "./controller/attendance.controller.js";
// import { getTodayVisitSummary } from "./controller/siteVisit.controller.js";
// import {
//   logRequest,
//   versionCheckMiddleware,
// } from "./middleware/auth.middleware.js";
// import Redis from "ioredis";
// import compression from "compression";
// import cookieParser from "cookie-parser";
// import { resetGraceAndRegularization } from "./controller/emlpoyeeShiftInfo.controller.js";
// import routerV2 from "./v2Router/routerV2.js";

// connectDatabase();

// // const app = express();
// // const server = http.createServer(app);
// // let conntectedUser = [];
// // let trackHistory = [];
// // const updateTimeline = async (data) => {
// //   const resp = await TransportModel.findByIdAndUpdate(data.transport, {
// //     $push: {
// //       timeline: data,
// //     },
// //   });
// // };
// // const io = new Server(server, {
// //   cors: {
// //     origin: "*", // Replace with your Flutter app's origin for better security
// //     methods: ["GET", "POST"],
// //   },
// // });

// // io.on("connection", (socket) => {
// //   console.log(`User connected: ${socket.id}`);
// //   socket.on("userConnected", (data) => {
// //     console.log(data);
// //     conntectedUser.push({
// //       socketId: socket.id,
// //       transport: data["transport"],
// //       loggedId: data["loggedId"],
// //     });
// //   });
// //   // Listen for location updates from the driver
// //   socket.on("locationUpdate", async (data) => {
// //     console.log("Location Update:", data);
// //     // Broadcast the updated location to other clients
// //     socket.emit("updateLocation", data);
// //     trackHistory.push({
// //       socketId: socket.id,
// //       ...data,
// //     });
// //     await updateTimeline({
// //       socketId: socket.id,
// //       ...data,
// //     });
// //     console.log("Broadcasting updateLocation");
// //   });

// //   socket.on("disconnect", () => {
// //     console.log(`User disconnected: ${socket.id}`);
// //     conntectedUser = conntectedUser.filter(
// //       (item) => item.socketId !== socket.id
// //     );
// //   });
// // });
// const app = express();
// const server = http.createServer(app);
// export const redis = new Redis({
//   host: "srv615709.hstgr.cloud",
//   port: 6379,
//   password: config.REDIS_KEY,
//   connectTimeout: 10000,
//   retryStrategy: (times) => Math.min(times * 50, 2000),
// });

// redis.on("connect", () => console.log("Connected to Redis!"));
// redis.on("error", (err) => console.error("Redis Error:", err));

// export let connectedUsers = [];
// let trackHistory = [];

// const updateTimeline = async (data) => {
//   try {
//     const resp = await TransportModel.findByIdAndUpdate(data.transport, {
//       $push: {
//         timeline: data,
//       },
//     });
//     console.log("Timeline updated for transport:", data.transport);
//   } catch (error) {
//     console.error("Error updating timeline:", error);
//   }
// };

// export const io = new Server(server, {
//   cors: {
//     origin: "*", // Replace with your Flutter app's origin for better security
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on("userConnected", (data) => {
//     console.log("User connected data:", data);

//     let foundUserIndex = connectedUsers.findIndex(
//       (ele) => ele?.userId === data?.userId
//     );

//     if (foundUserIndex !== -1) {
//       // Update existing user
//       if (data?.platform === "android") {
//         connectedUsers[foundUserIndex].phoneSocketId = socket.id;
//       } else {
//         connectedUsers[foundUserIndex].webSocketId = socket.id;
//       }
//       connectedUsers[foundUserIndex].socketId = socket.id;
//       connectedUsers[foundUserIndex].transport = data?.transport;
//       connectedUsers[foundUserIndex].loggedId = data?.loggedId;
//     } else {
//       // New user
//       connectedUsers.push({
//         socketId: socket.id,
//         phoneSocketId: data.platform === "android" ? socket.id : null,
//         webSocketId: data.platform !== "android" ? socket.id : null,
//         transport: data?.transport,
//         loggedId: data?.loggedId,
//         userId: data?.userId,
//       });
//     }
//     const user = connectedUsers.find((ele) => ele.userId === data?.userId);
//     console.log("found user:", user);
//     io.to(user?.webSocketId).emit("onChangeUserInfo", user);
//     io.to(user?.phoneSocketId).emit("onChangeUserInfo", user);

//     console.log("Connected users:", connectedUsers);
//   });

//   socket.on("callCustomerWeb", async (data) => {
//     console.log("call web trigger");
//     console.log(data);
//     const user = connectedUsers.find((ele) => ele.userId === data?.userId);
//     io.to(user?.phoneSocketId).emit("callCustomer", {
//       lead: data?.lead,
//       phoneNumber: data?.phoneNumber,
//       type: data?.type,
//       message: data?.message,
//     });
//   });
//   // Listen for location updates from the driver
//   socket.on("locationUpdate", async (data) => {
//     console.log("Location Update received:", data);
//     try {
//       // Broadcast the updated location to all clients except the sender
//       socket.broadcast.emit("updateLocation", data);
//       console.log("Broadcasting updateLocation to all clients except sender");

//       trackHistory.push({
//         socketId: socket.id,
//         ...data,
//       });

//       await updateTimeline({
//         socketId: socket.id,
//         ...data,
//       });
//     } catch (error) {
//       console.error("Error processing locationUpdate:", error);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//     let foundUserIndex = connectedUsers.findIndex(
//       (ele) =>
//         ele?.phoneSocketId === socket.id || ele?.webSocketId === socket.id
//     );

//     if (foundUserIndex !== -1) {
//       // Update existing user
//       if (connectedUsers[foundUserIndex].phoneSocketId === socket.id) {
//         connectedUsers[foundUserIndex].phoneSocketId = null;
//       } else if (connectedUsers[foundUserIndex].webSocketId === socket.id) {
//         connectedUsers[foundUserIndex].webSocketId = null;
//       }

//       io.to(connectedUsers[foundUserIndex]?.webSocketId).emit(
//         "onChangeUserInfo",
//         connectedUsers[foundUserIndex]
//       );
//       io.to(connectedUsers[foundUserIndex]?.phoneSocketId).emit(
//         "onChangeUserInfo",
//         connectedUsers[foundUserIndex]
//       );
//     }

//     console.log("Remaining connected users:", connectedUsers);
//   });

//   // Add ping/pong for connection testing
//   socket.on("ping", () => {
//     console.log(`Received ping from ${socket.id}`);
//     socket.emit("pong");
//   });

//   // Add test event handler
//   socket.on("testEvent", (data) => {
//     console.log(`Received testEvent from ${socket.id}:`, data);
//     socket.emit("testEventResponse", {
//       message: "Test event received successfully",
//     });
//   });
// });
// app.use(
//   compression({
//     filter: (req, res) => {
//       if (req.headers["x-no-compression"]) return false; // custom header to skip
//       const contentType = res.getHeader("Content-Type") || "";
//       return !contentType.includes("image") && compression.filter(req, res);
//     },
//   })
// );
// app.use(cookieParser());
// app.use(hostnameCheck);
// app.use(express.json({ limit: "2gb" }));
// app.use(express.urlencoded({ limit: "2gb", extended: true }));
// app.set("view engine", "ejs");

// app.use(cors());

// app.use(logRequest);
// app.use(versionCheckMiddleware);
// app.use(router);
// app.use("/v2", routerV2);

// app.use(notFound);
// app.use(errorHandler);

// // Schedule a task to run at 9 AM daily and change cycle
// cron.schedule("0 9 * * *", async () => {
//   try {
//     // Make the API call
//     // const response = await axios.get(
//     //   "https://api.evhomes.tech/lead-trigger-cycle-change"
//     // );
//     const response = await triggerCycleChangeFunctionFix();
//     // const response = await triggerCycleChangeFunction();

//     await triggerHistoryModel.create({
//       date: new Date(),
//       changes: response?.changes ?? [],
//       changesString: response?.changesString ?? "",
//       totalTrigger: response?.total ?? 0,
//       message: response?.message ?? "",
//     });
//   } catch (error) {
//     console.error("Error making API call:", error.message);
//   }
// });
// // Check for incomplete tasks
// cron.schedule("0 * * * *", async () => {
//   // Runs every hour
//   await getlast24HrNotFeedbackLeads();
// });

// // cron.schedule("0 * * * *", async () => {
// //   // Runs every hour
// //   await getCpFeedbackPendingVisits();
// // });

// // Check for incomplete tasks
// cron.schedule("0 * * * *", async () => {
//   // Runs every hour
//   await getlast24HrNotAssignedLeads();
// });

// // Schedule the job to run every day at 11:58 PM local time
// cron.schedule("58 23 * * *", async () => {
//   console.log("Running cron job at 11:58 PM local time...");
//   await insertDailyAttendance();
//   // Add your task logic here
// });

// // Schedule the job to run every day at 11:58 PM local time
// cron.schedule("00 22 * * *", async () => {
//   console.log("Running cron job at 10:00 PM local time...");
//   await getTodayVisitSummary();
//   // Add your task logic here
// });

// cron.schedule("1 0 1 * *", async () => {
//   await resetGraceAndRegularization();
//   console.log("Running job at 12:01 AM on the 1st of every month");
// });

// // // Trigger at 5:30 AM
// // cron.schedule("30 5 * * *", async () => {
// //   console.log("Triggered at 5:30 AM local time");
// //   await insertDailyAttendance();
// // });

// // // Trigger at 11:59 PM
// // cron.schedule("59 23 * * *", async () => {
// //   console.log("Triggered at 11:59 PM local time");
// //   await markPendingDailyAttendance();
// // });

// server.listen(config.PORT, () =>
//   console.log("listening on port " + config.PORT)
// );

// export default app;
