const Joi = require("joi");
const mongoose = require("mongoose");
const Department = require("./models/Department");
const {
  errorResponse,
  catchResponse,
  successResponse,
} = require("../utils/response");

const departmentSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim()
});

function validateDepartment(department) {
  return departmentSchema.validate(department);
}

// Create a new department (Admin only)
async function createDepartment(req, res) {
  const { error, value } = validateDepartment(req.body);
  if (error) {
    return errorResponse(res, 400, error.details[0].message);
  }

  try {
    const existingDepartment = await Department.findOne({
      name: value,
    });
    if (existingDepartment) {
      return errorResponse(
        res,
        400,
        "Department with this name already exists"
      );
    }

    const department = new Department(value);
    await department.save();

    return successResponse(res, department, "Department created successfully");
  } catch (error) {
    return catchResponse(res, error);
  }
}

// Get all departments
// Get all departments
async function getAllDepartments(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
  
    try {
      const totalDepartments = await Department.countDocuments();
      const departments = await Department.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);
  
      if (!departments.length) {
        return errorResponse(res, 404, "No departments found");
      }
  
      const totalPages = Math.ceil(totalDepartments / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
  
      const paginationInfo = {
        currentPage: page,
        totalPages: totalPages,
        totalDepartments: totalDepartments,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      };
  
      return successResponse(res, { departments, paginationInfo }, "Departments retrieved successfully");
    } catch (error) {
      return catchResponse(res, error);
    }
  }

// Get a single department by ID
async function getDepartmentById(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, "Invalid department ID");
  }

  try {
    const department = await Department.findById(id);
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(
      res,
      department,
      "Department retrieved successfully"
    );
  } catch (error) {
    return catchResponse(res, error);
  }
}

// Update a department (Admin only)
async function updateDepartment(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, "Invalid department ID");
  }

  const { error } = validateDepartment(req.body);
  if (error) {
    return errorResponse(res, 400, error.details[0].message);
  }

  try {
    const department = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(res, department, "Department updated successfully");
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        400,
        "Department with this name already exists"
      );
    }
    return catchResponse(res, error);
  }
}

// Delete a department (Admin only)
async function deleteDepartment(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, "Invalid department ID");
  }

  try {
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(res, department, "Department deleted successfully");
  } catch (error) {
    return catchResponse(res, error);
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
