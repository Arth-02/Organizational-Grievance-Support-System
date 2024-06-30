const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  url: { type: String, required: true },
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grievance",
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attachment", AttachmentSchema);