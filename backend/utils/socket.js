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

    socket.on("register_user", (userId) => {
      users[userId] = socket.id;
    });

    socket.on("disconnect", () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
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
