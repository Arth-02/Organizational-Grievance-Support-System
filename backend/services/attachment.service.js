const Attachment = require("../models/attachment.model");
const uploadFiles = require("../utils/cloudinary");

// Create a new attachment
const createAttachment = async (session, user_id, organization_id, files) => {
  try {
    let attachmentIds = [];
    for (let file of files) {
      const result = await uploadFiles(file, organization_id);
      if (!result) {
        console.error(
          "Error uploading attachments in Attachment Service createAttachment"
        );
        return {
          isSuccess: false,
          message: "Error uploading attachments",
          code: 400,
        };
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
    console.log("Attachment Ids:", attachmentIds);
    return { isSuccess: true, attachmentIds };
  } catch (error) {
    console.error(
      "Error creating attachment in Attachment Service createAttachment:",
      error.message
    );
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete an attachment
const deleteAttachment = async (session, attachment_id) => {
  try {
    const attachment = await Attachment.updateMany(
      { _id: { $in: attachment_id } },
      { is_active: false }
    ).session(session);
    if (!attachment) {
      console.error(
        "Error deleting attachment in Attachment Service deleteAttachment"
      );
      return {
        isSuccess: false,
        message: "Error deleting attachment",
        code: 400,
      };
    }
    return { isSuccess: true };
  } catch (error) {
    console.error(
      "Error deleting attachment in Attachment Service deleteAttachment:",
      error.message
    );
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

module.exports = { createAttachment, deleteAttachment };
