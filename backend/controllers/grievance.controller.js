const Grievance = require("../models/Grievance");
const Department = require("../models/department.model");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");

const grievanceSchema = Joi.object({
  title: Joi.string().required().min(5).max(100),
  description: Joi.string().required().min(10).max(1000),
  department: Joi.string().required().hex().length(24),
  severity: Joi.string().valid("low", "medium", "high").required(),
  attachments: Joi.array().items(Joi.string().hex().length(24)),
});

async function createGrievance(req, res) {
  try {
    // Validate input
    const { error } = grievanceSchema.validate(req.body);
    if (error) {
      return errorResponse(res, 400, error.details[0].message);
    }

    const { title, description, department, severity, attachments } = req.body;

    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return errorResponse(res, 400, "Invalid department");
    }

    const newGrievance = new Grievance({
      title,
      description,
      department,
      severity,
      reportedBy: req.user._id, // Assuming req.user is populated by auth middleware
      attachments: attachments || [], // Only include if attachments are provided
    });

    await newGrievance.save();

    return successResponse(res, newGrievance, "Grievance created successfully");
  } catch (err) {
    console.error("Create Grievance Error:", err);
    return catchResponse(res);
  }
}

// Update a grievance
async function updateGrievance(req, res) {
  try {
    const { id } = req.params;
    const { title, description, department, severity, status, assignedTo } = req.body;

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
