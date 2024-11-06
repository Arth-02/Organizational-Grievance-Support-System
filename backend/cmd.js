const mongoose = require("mongoose");
const Grievance = require("./models/grievance.model");
const { updateModelRanks, resetAllRanks } = require("./utils/rank");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB;

async function resatAllRanks() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB,
    });

    const result = await resetAllRanks({
      model: Grievance,
      orderBy: "createdAt",
    });

    console.log("Migration complete:", result);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

async function migrateOldGrivances() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB,
    });

    const result = await updateModelRanks({
      model: Grievance,
      orderBy: "date_reported",
    });

    console.log("Migration complete:", result);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// switch case to handle different cmd operations

switch (process.argv[2]) {
  case "reset-ranks":
    resatAllRanks();
    break;
  case "migrate-old-grievances":
    migrateOldGrivances();
    break;
  default:
    console.log("Invalid command");
    process.exit(1);
}
