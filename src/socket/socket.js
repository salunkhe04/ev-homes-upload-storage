import { Server } from "socket.io";
import { server } from "../app/app.js";
import { registerSocketEvents } from "./handler.js";
import logger from "../utils/logger.js";

export let connectedUsers = [];

export const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your Flutter app's origin for better security
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // logger.info(`User connected: ${socket.id}`);
  registerSocketEvents(io, socket, connectedUsers);
});
