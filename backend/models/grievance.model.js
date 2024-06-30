const mongoose = require("mongoose");

const GrievanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  severity: { type: String, enum: ["low", "medium", "high"], required: true},
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
  isDeleted: { type: Boolean, default: false },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dateReported: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Grievance", GrievanceSchema);
