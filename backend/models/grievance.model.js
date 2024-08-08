const mongoose = require("mongoose");

const GrievanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: [true, "Department is required"],
  },
  severity: { type: String, enum: ["low", "medium", "high"], required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
  status: {
    type: String,
    enum: [
      "submitted",
      "reviewing",
      "assigned",
      "in-progress",
      "resolved",
      "dismissed",
    ],
    default: "submitted",
  },
  is_deleted: { type: Boolean, default: false },
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date_reported: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Grievance", GrievanceSchema);
