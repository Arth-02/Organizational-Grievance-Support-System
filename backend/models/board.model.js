const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Column key is required"],
      trim: true,
    },
    label: {
      type: String,
      required: [true, "Column label is required"],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, "Column order is required"],
    },
  },
  { _id: false }
);

const BoardSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    name: {
      type: String,
      required: [true, "Board name is required"],
      trim: true,
    },
    columns: {
      type: [ColumnSchema],
      default: [],
      validate: {
        validator: function (columns) {
          // Ensure column keys are unique within the board
          const keys = columns.map((col) => col.key);
          return keys.length === new Set(keys).size;
        },
        message: "Column keys must be unique within a board",
      },
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Compound index for project_id and is_active to optimize queries
BoardSchema.index({ project_id: 1, is_active: 1 });

// Index for organization_id to optimize queries filtering by organization
BoardSchema.index({ organization_id: 1 });

const Board = mongoose.model("Board", BoardSchema);

module.exports = Board;
