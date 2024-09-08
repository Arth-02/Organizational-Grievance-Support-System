const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const Attachment = require("../models/attachment.model");
const mongoose = require("mongoose");
const uploadFiles = require("../helpers/cloudinary");
const { isValidObjectId } = require("mongoose");

const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const Role = require("../models/role.model");
const {
  createGrievanceSchema,
  updateStatusGrievanceSchema,
  updateAssignedGrievanceSchema,
  updateFullGrievanceSchema,
} = require("../validators/grievance.validator");

async function createGrievance(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { error, value } = createGrievanceSchema.validate(req.body);
    if (error) {
      await session.abortTransaction();
      return errorResponse(res, 400, error.details[0].message);
    }

    const { title, description, severity, status, department_id } = value;
    const { organization_id, employee_id } = req.user;
    const reported_by = req.user._id;

    const departmentExists = await Department.findOne({
      organization_id,
      _id: department_id,
    });
    if (!departmentExists) {
      return errorResponse(res, 400, "Invalid department");
    }

    let newGrievance = new Grievance({
      organization_id,
      title,
      description,
      department_id,
      severity,
      status,
      reported_by,
      employee_id,
    });
    let attachmentIds = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await uploadFiles(file, organization_id);
        if (!result) {
          await session.abortTransaction();
          return errorResponse(res, 400, "Error uploading attachments");
        }
        const newAttachment = new Attachment({
          filename: file.originalname,
          public_id: result.public_id,
          filetype: file.mimetype,
          filesize: file.size,
          url: result.secure_url,
          grievance_id: newGrievance._id,
          organization_id,
          uploaded_by: req.user._id,
        });
        const savedAttachment = await newAttachment.save({ session });
        attachmentIds.push(savedAttachment._id);
      }
    }

    newGrievance.attachments = attachmentIds;
    await newGrievance.save({ session });
    session.commitTransaction();
    return successResponse(
      res,
      newGrievance,
      "Grievance created successfully",
      201
    );
  } catch (err) {
    console.error("Create Grievance Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
}

// Update a grievance
async function updateGrievance(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }
    const { organization_id, role } = req.user;
    const permissions = await Role.findById(role).select("permissions");
    if (!permissions) {
      return errorResponse(res, 400, "Role not found");
    }
    const permission = permissions.permissions;
    let schema;
    if (permission.includes("UPDATE_GRIEVANCE")) {
      schema = updateFullGrievanceSchema;
      if (!isValidObjectId(req.body.department_id)) {
        return errorResponse(res, 400, "Invalid department ID");
      }
    } else if (
      permission.includes("UPDATE_GRIEVANCE_STATUS") &&
      req.body.status
    ) {
      schema = updateStatusGrievanceSchema;
    } else if (
      permission.includes("UPDATE_GRIEVANCE_ASSIGNEE") &&
      req.body.assigned_to
    ) {
      schema = updateAssignedGrievanceSchema;
    } else {
      return errorResponse(res, 403, "Permission denied");
    }

    const { error, value } = schema.validate(req.body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const updatedGrievance = await Grievance.findOneAndUpdate(
      { _id: id, organization_id },
      value,
      {
        new: true,
      }
    );
    if (!updatedGrievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    return successResponse(
      res,
      updatedGrievance,
      "Grievance updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Error:", err.message);
    return catchResponse(res);
  }
}

// Soft delete a grievance
async function deleteGrievance(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }

    grievance.is_active = false;
    await grievance.save();

    return successResponse(res, null, "Grievance deleted successfully");
  } catch (err) {
    console.error("Soft Delete Grievance Error:", err.message);
    return catchResponse(res);
  }
}

// Get all non-deleted grievances
async function getAllGrievances(req, res) {
  try {
    const grievances = await Grievance.find({ is_active: true })
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
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }

    const grievance = await Grievance.findOne({ _id: id, is_active: true })
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
