// grievanceService.js
const mongoose = require('mongoose');
const { createGrievanceSchema } = require('../validators/grievance.validator');
const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const Attachment = require("../models/attachment.model");
const uploadFiles = require("../utils/cloudinary");
const {
    successResponse,
    errorResponse,
    catchResponse,
  } = require("../utils/response");

// Create a new grievance
const createGrievance = async (body, user, files) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error, value } = createGrievanceSchema.validate(body);
    if (error) {
      await session.abortTransaction();
      throw new Error(error.details[0].message);
    }

    const { title, description, priority, status, department_id } = value;
    const { organization_id, employee_id } = user;
    const reported_by = user._id;

    const departmentExists = await Department.findOne({
      organization_id,
      _id: department_id,
    }).session(session);
    if (!departmentExists) {
      await session.abortTransaction();
      throw new Error("Invalid department");
    }

    let newGrievance = new Grievance({
      organization_id,
      title,
      description,
      department_id,
      priority,
      status,
      reported_by,
      employee_id,
    });

    let attachmentIds = [];
    if (files && files.length > 0) {
      for (let file of files) {
        const result = await uploadFiles(file, organization_id);
        if (!result) {
          await session.abortTransaction();
          throw new Error("Error uploading attachments");
        }
        const newAttachment = new Attachment({
          filename: file.originalname,
          public_id: result.public_id,
          filetype: file.mimetype,
          filesize: file.size,
          url: result.secure_url,
          grievance_id: newGrievance._id,
          organization_id,
          uploaded_by: user._id,
        });
        const savedAttachment = await newAttachment.save({ session });
        attachmentIds.push(savedAttachment._id);
      }
    }

    newGrievance.attachments = attachmentIds;
    await newGrievance.save({ session });
    await session.commitTransaction();

    return {
      data: newGrievance,
      message: "Grievance created successfully",
      statusCode: 201,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createGrievance,
};
