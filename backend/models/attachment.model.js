const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    filetype: {
      type: String,
      required: true,
    },
    filesize: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    grievance_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true,
    },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: {
      createdAt: "upload_date",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

const Attachment = mongoose.model("Attachment", AttachmentSchema);

module.exports = Attachment;
