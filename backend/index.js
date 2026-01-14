const express = require("express");
const { createServer } = require("http");

require("dotenv").config();
const PORT = process.env.PORT;
const cors = require("cors");
const connectDB = require("./database/db");
const routes = require("./routes/index.route");
const webhookRoutes = require("./routes/webhook.routes");
const { socketHandler } = require("./utils/socket");

const app = express();

const httpServer = createServer(app);

socketHandler(httpServer);

connectDB();

app.use(cors());

// Webhook routes MUST be registered BEFORE express.json() middleware
// because Stripe requires the raw body for signature verification
app.use("/webhooks", express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use("/", routes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
