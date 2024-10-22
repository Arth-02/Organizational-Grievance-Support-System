// socket.js
const { Server } = require("socket.io");

const users = {}; // This will store userID -> socketID mapping

const socketHandler = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    // Listen for event where user sends their userID to identify them
    socket.on("register_user", (userId) => {
      users[userId] = socket.id; // Map userID to socket ID
      console.log(`User ${userId} is connected with socket ID: ${socket.id}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);

      // Remove the user from users object when they disconnect
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return { io, users }; // Return both io instance and users mapping
};

module.exports = socketHandler;
