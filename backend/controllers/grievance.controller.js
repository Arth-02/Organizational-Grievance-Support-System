const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const Attachment = require("../models/attachment.model");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("../helpers/cloudinary");

const options = {
  use_filename: true,
  unique_filename: false,
  overwrite: true,
};

const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const Joi = require("joi");
const upload = require("../helpers/upload");

const uploadFiles = upload.array("attachments", 5);

const createGrievanceSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  severity: Joi.string().valid("low", "medium", "high").required(),
  attachments: Joi.array().items(Joi.object()),
  status: Joi.string()
    .valid(
      "submitted",
      "reviewing",
      "assigned",
      "in-progress",
      "resolved",
      "dismissed"
    )
    .default("submitted")
    .required(),
});

async function createGrievance(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("Creating grievance...");
  uploadFiles(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err.message, err);
      return errorResponse(res, 400, err.message);
    } else if (err) {
      console.error("Upload Error:", err.message, err);
      return errorResponse(res, 400, err.message);
    }

    try {
      // Validate input
      const { error, value } = createGrievanceSchema.validate(req.body);
      if (error) {
        await session.abortTransaction();
        return errorResponse(res, 400, error.details[0].message);
      }

      const { title, description, severity, status } = value;
      const { organization_id, department } = req.user;
      const reported_by = req.user._id;

      // Check if department exists
      const departmentExists = await Department.findOne({
        organization_id,
        _id: department,
      });
      if (!departmentExists) {
        return errorResponse(res, 400, "Invalid department");
      }

      const newGrievance = new Grievance({
        organization_id,
        title,
        description,
        department_id: department,
        severity,
        status,
        reported_by,
      });
      // console.log("Creating grievance...");
      // console.log("Title:", title);
      // console.log("Description:", description);
      // console.log("Severity:", severity);
      // console.log("Status:", status);
      // console.log("Organization ID:", organization_id);
      // console.log("Department ID:", department);
      // console.log("Reported By:", reported_by);
      // console.log("Attachments:", req.files);
      // return successResponse(res, null, "Grievance created successfully");

      let attachmentIds = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          console.log("Uploading attachment...");
          console.log("File:", file);
          console.log("File Path:", file.path);
          // const result = await cloudinary.uploader.upload(file.path, options);
          // if (!result) {
          //   await session.abortTransaction();
          //   return errorResponse(res, 400, "Error uploading attachments");
          // }
          // const newAttachment = new Attachment({
          //   filename: file.originalname,
          //   filetype: file.mimetype,
          //   filesize: file.size,
          //   url: result.secure_url,
          //   grievance_id: newGrievance._id,
          //   organization_id,
          //   uploaded_by: req.user._id,
          // });
          // const savedAttachment = await newAttachment.save({ session });
          // attachmentIds.push(savedAttachment._id);
        }
      }

      // newGrievance.attachments = attachmentIds;
      // await newGrievance.save();
      session.commitTransaction();
      return successResponse(
        res,
        newGrievance,
        "Grievance created successfully"
      );
    } catch (err) {
      console.error("Create Grievance Error:", err);
      await session.abortTransaction();
      return catchResponse(res);
    } finally {
      session.endSession();
    }
  });
}

// Update a grievance
async function updateGrievance(req, res) {
  try {
    const { id } = req.params;
    const { title, description, department, severity, status, assignedTo } =
      req.body;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }

    // Update fields if provided
    if (title) grievance.title = title;
    if (description) grievance.description = description;
    if (department) grievance.department = department;
    if (severity) grievance.severity = severity;
    if (status) grievance.status = status;
    if (assignedTo) grievance.assignedTo = assignedTo;

    await grievance.save();

    return successResponse(res, grievance, "Grievance updated successfully");
  } catch (err) {
    console.error("Update Grievance Error:", err.message);
    return catchResponse(res);
  }
}

// Soft delete a grievance
async function deleteGrievance(req, res) {
  try {
    const { id } = req.params;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }

    grievance.isDeleted = true;
    await grievance.save();

    return successResponse(res, null, "Grievance soft deleted successfully");
  } catch (err) {
    console.error("Soft Delete Grievance Error:", err.message);
    return catchResponse(res);
  }
}

// Get all non-deleted grievances
async function getAllGrievances(req, res) {
  try {
    const grievances = await Grievance.find({ isDeleted: false })
      .populate("department", "name")
      .populate("reportedBy", "username")
      .populate("assignedTo", "username");

    return successResponse(
      res,
      grievances,
      "Grievances retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Grievances Error:", err.message);
    return catchResponse(res);
  }
}

// Get a specific grievance
async function getGrievance(req, res) {
  try {
    const { id } = req.params;

    const grievance = await Grievance.findOne({ _id: id, isDeleted: false })
      .populate("department", "name")
      .populate("reportedBy", "username")
      .populate("assignedTo", "username");

    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }

    return successResponse(res, grievance, "Grievance retrieved successfully");
  } catch (err) {
    console.error("Get Grievance Error:", err.message);
    return catchResponse(res);
  }
}

module.exports = {
  createGrievance,
  updateGrievance,
  deleteGrievance,
  getAllGrievances,
  getGrievance,
};
