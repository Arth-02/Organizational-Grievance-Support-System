const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

require("dotenv").config();
const PORT = process.env.PORT;
const cors = require("cors");
const connectDB = require("./database/db");
const routes = require("./routes/index.route");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all origins
  },
});

const users = {}; // This will store userID -> socketID mapping

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  // Listen for event where user sends their userID to identify them
  socket.on("register_user", (userId) => {
    users[userId] = socket.id; // Map userID to socket ID
    console.log(`User ${userId} is connected with socket ID: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);

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


connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.io = io;
  req.users = users;
  next();
});

app.use("/", routes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
