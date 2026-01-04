const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: [true, "Tag is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    due_date: {
      type: Date,
      default: null,
    },
    assignee_to: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    attachments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Attachment",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    is_submitted: {
      type: Boolean,
    },
    is_finished: {
      type: Boolean,
    },
    rank: {
      type: String,
      default: null,
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

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
