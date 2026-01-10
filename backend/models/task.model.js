const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
    },
    message: {
      type: String,
      required: [true, "Comment message is required"],
      trim: true,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    is_edited: {
      type: Boolean,
      default: false,
    },
    edited_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const ActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "assignee_changed",
        "priority_changed",
        "comment_added",
        "attachment_added",
        "updated",
      ],
      required: [true, "Activity action is required"],
    },
    field: {
      type: String,
      default: null,
    },
    from: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    to: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performer is required"],
    },
    performed_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);


const TaskSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    issue_key: {
      type: String,
      required: [true, "Issue key is required"],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["task", "bug", "story", "epic", "subtask"],
      default: "task",
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Task status is required"],
      index: true,
    },
    priority: {
      type: String,
      enum: ["lowest", "low", "medium", "high", "highest"],
      default: "medium",
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    due_date: {
      type: Date,
      default: null,
    },
    rank: {
      type: String,
      index: true,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    comments: {
      type: [CommentSchema],
      default: [],
    },
    activity: {
      type: [ActivitySchema],
      default: [],
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

// Index for project_id to optimize queries filtering by project
TaskSchema.index({ project_id: 1 });

// Compound index for project_id and status for board views
TaskSchema.index({ project_id: 1, status: 1 });

// Compound index for project_id, status, and rank for ordered board views
TaskSchema.index({ project_id: 1, status: 1, rank: 1 });

// Index for issue_key (unique constraint already creates an index)
TaskSchema.index({ issue_key: 1 });

// Index for assignee to optimize "my tasks" queries
TaskSchema.index({ assignee: 1 });

// Index for reporter to optimize "reported by me" queries
TaskSchema.index({ reporter: 1 });

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
