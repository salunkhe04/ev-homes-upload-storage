let trackHistory = []; // Or move to a DB/model if persistent

export const registerSocketEvents = (io, socket, connectedUsers) => {
  socket.on("userConnected", (data) => {
    // console.log("User connected data:", data);

    let foundUserIndex = connectedUsers.findIndex(
      (ele) => ele?.userId === data?.userId
    );

    if (foundUserIndex !== -1) {
      // Update existing user
      if (data?.platform === "android") {
        connectedUsers[foundUserIndex].phoneSocketId = socket.id;
      } else {
        connectedUsers[foundUserIndex].webSocketId = socket.id;
      }
      connectedUsers[foundUserIndex].socketId = socket.id;
      connectedUsers[foundUserIndex].transport = data?.transport;
      connectedUsers[foundUserIndex].loggedId = data?.loggedId;
    } else {
      // New user
      connectedUsers.push({
        socketId: socket.id,
        phoneSocketId: data.platform === "android" ? socket.id : null,
        webSocketId: data.platform !== "android" ? socket.id : null,
        transport: data?.transport,
        loggedId: data?.loggedId,
        userId: data?.userId,
      });
    }
    const user = connectedUsers.find((ele) => ele.userId === data?.userId);
    // console.log("found user:", user);
    io.to(user?.webSocketId).emit("onChangeUserInfo", user);
    io.to(user?.phoneSocketId).emit("onChangeUserInfo", user);

    // console.log("Connected users:", connectedUsers);
  });

  socket.on("callCustomerWeb", async (data) => {
    // console.log("call web trigger");
    // console.log(data);
    const user = connectedUsers.find((ele) => ele.userId === data?.userId);
    io.to(user?.phoneSocketId).emit("callCustomer", {
      lead: data?.lead,
      phoneNumber: data?.phoneNumber,
      type: data?.type,
      message: data?.message,
    });
  });
  // Listen for location updates from the driver
  socket.on("locationUpdate", async (data) => {
    // console.log("Location Update received:", data);
    try {
      // Broadcast the updated location to all clients except the sender
      socket.broadcast.emit("updateLocation", data);
      // console.log("Broadcasting updateLocation to all clients except sender");

      trackHistory.push({
        socketId: socket.id,
        ...data,
      });

      //TODO:Timeline-update for transport system

      // await updateTimeline({
      //   socketId: socket.id,
      //   ...data,
      // });
    } catch (error) {
      // console.error("Error processing locationUpdate:", error);
    }
  });

  socket.on("disconnect", () => {
    // console.log(`User disconnected: ${socket.id}`);
    let foundUserIndex = connectedUsers.findIndex(
      (ele) =>
        ele?.phoneSocketId === socket.id || ele?.webSocketId === socket.id
    );

    if (foundUserIndex !== -1) {
      // Update existing user
      if (connectedUsers[foundUserIndex].phoneSocketId === socket.id) {
        connectedUsers[foundUserIndex].phoneSocketId = null;
      } else if (connectedUsers[foundUserIndex].webSocketId === socket.id) {
        connectedUsers[foundUserIndex].webSocketId = null;
      }

      io.to(connectedUsers[foundUserIndex]?.webSocketId).emit(
        "onChangeUserInfo",
        connectedUsers[foundUserIndex]
      );
      io.to(connectedUsers[foundUserIndex]?.phoneSocketId).emit(
        "onChangeUserInfo",
        connectedUsers[foundUserIndex]
      );
    }

    // console.log("Remaining connected users:", connectedUsers);
  });

  // Add ping/pong for connection testing
  socket.on("ping", () => {
    // console.log(`Received ping from ${socket.id}`);
    socket.emit("pong");
  });

  // Add test event handler
  socket.on("testEvent", (data) => {
    // console.log(`Received testEvent from ${socket.id}:`, data);
    socket.emit("testEventResponse", {
      message: "Test event received successfully",
    });
  });
};
