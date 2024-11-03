const Attachment = require("../models/attachment.model");
const uploadFiles = require("../utils/cloudinary");
const mongoose = require("mongoose");

// Create a new attachment
const createAttachment = async (
  session,
  user_id,
  organization_id,
  files
) => {
  try {
    let attachmentIds = [];
    for (let file of files) {
      const result = await uploadFiles(file, organization_id);
      if (!result) {
        console.error(
          "Error uploading attachments in Attachment Service createAttachment"
        );
        return { isSuccess: false, message: "Error uploading attachments" };
      }
      const newAttachment = new Attachment({
        filename: file.originalname,
        public_id: result.public_id,
        filetype: file.mimetype,
        filesize: file.size,
        url: result.secure_url,
        organization_id,
        uploaded_by: user_id,
      });
      const savedAttachment = await newAttachment.save({ session });
      attachmentIds.push(savedAttachment._id);
    }
    return { isSuccess: true, attachmentIds };
  } catch (error) {
    console.error(
      "Error creating attachment in Attachment Service createAttachment:",
      error.message
    );
    return { isSuccess: false, message: error.message };
  }
};

module.exports = { createAttachment };
