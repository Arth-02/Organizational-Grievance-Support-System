const { Server } = require("socket.io");

const users = {};
let io;

const socketHandler = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("register_user", (userId) => {
      users[userId] = socket.id;
      console.log(`User ${userId} is connected with socket ID: ${socket.id}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);

      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { socketHandler, getIo, users };
