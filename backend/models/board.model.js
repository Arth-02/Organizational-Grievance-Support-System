const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: ["todo", "in-progress", "done"],
    },
    tasks: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Task",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
