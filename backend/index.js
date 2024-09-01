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

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("notification", (msg) => {
    console.log("message: " + msg);
    io.emit("receive_notification", msg);
  });
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
