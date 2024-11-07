const mongoose = require("mongoose");
const Grievance = require("./models/grievance.model");
const { updateModelRanks, resetAllRanks } = require("./utils/rank");
const LexoRank = require("./services/lexorank.service");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB;

async function resetRanks() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB,
    });

    const result = await resetAllRanks({
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

async function migrateOldGrievances() {
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

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case "reset-ranks":
    resetRanks();
    break;
  case "migrate-old-grievances":
    migrateOldGrievances();
    break;
  case "get-middle-rank":
    if (arg1 || arg2) {
      console.log(`Middle rank between "${arg1}" and "${arg2}`);
      const middleRank = LexoRank.getMiddleRank(arg1, arg2);
      console.log(`Middle rank between "${arg1}" and "${arg2}": ${middleRank}`);
    } else {
      console.log("Please provide two ranks to get the middle rank.");
      process.exit(1);
    }
    break;
  default:
    console.log("Invalid command");
    process.exit(1);
}
