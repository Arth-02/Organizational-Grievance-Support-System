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
    assignee: {
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
    is_active: {
      type: Boolean,
      default: true,
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

const boardSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    tags: {
      type: [String],
      default: ["todo", "in-progress", "done"],
    },
    tasks: {
      type: [taskSchema],
    },
    is_active: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("Board", boardSchema);
