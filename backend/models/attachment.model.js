const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filetype: { type: String, required: true },
  filesize: { type: Number, required: true },
  url: { type: String, required: true },
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grievance",
    required: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  upload_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attachment", AttachmentSchema);