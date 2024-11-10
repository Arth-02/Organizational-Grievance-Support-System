const express = require("express");
const { createServer } = require("http");

require("dotenv").config();
const PORT = process.env.PORT;
const cors = require("cors");
const connectDB = require("./database/db");
const routes = require("./routes/index.route");
const { socketHandler } = require("./utils/socket");

const app = express();

const httpServer = createServer(app);

socketHandler(httpServer);

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
