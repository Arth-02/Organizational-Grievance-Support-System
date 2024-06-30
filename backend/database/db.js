const mongoose = require("mongoose");
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI ;
const MONGO_DB = process.env.MONGO_DB;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI + MONGO_DB);
    console.log("MongoDB connection SUCCESS");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
