const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
      default: null,
    },
    incharge: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    borad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
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

module.exports = mongoose.model("Project", projectSchema);
