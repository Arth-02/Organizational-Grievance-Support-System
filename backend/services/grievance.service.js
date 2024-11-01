// grievanceService.js
const mongoose = require("mongoose");
const { createGrievanceSchema } = require("../validators/grievance.validator");
const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const attachmentService = require("./attachment.service");

// Create a new grievance
const createGrievance = async (session, body, user, files) => {
  try {
    const { error, value } = createGrievanceSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }

    const { title, description, priority, status, department_id } = value;
    const { organization_id, employee_id } = user;
    const reported_by = user._id;

    const departmentExists = await Department.findOne({
      organization_id,
      _id: department_id,
    }).session(session);
    if (!departmentExists) {
      return {
        isSuccess: false,
        message: "Department does not exist in this organization",
      };
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

    const response = await attachmentService.createAttachment(
      session,
      newGrievance._id,
      user._id,
      organization_id,
      files
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message };
    }
    const attachmentIds = response.attachmentIds;
    newGrievance.attachments = attachmentIds;
    await newGrievance.save({ session });
    return { isSuccess: true, grievance: newGrievance };
  } catch (err) {
    return { isSuccess: false, message: err.message };
  }
};

module.exports = {
  createGrievance,
};
