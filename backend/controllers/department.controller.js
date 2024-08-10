const Joi = require("joi");
const mongoose = require("mongoose");
const Department = require("../models/department.model");
const Organization = require("../models/organization.model");
const {
  errorResponse,
  catchResponse,
  successResponse,
} = require("../utils/response");

const departmentSchema = Joi.object({
  organization_id: Joi.string().required().trim(),
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
});

// Create a new department
async function createDepartment(req, res) {
  const { error, value } = departmentSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return errorResponse(res, 400, errors);
  }

  try {
    const { organization_id, name } = value;
    const existingDepartment = await Department.findOne({
      name: name,
      organization_id: organization_id,
    });
    if (existingDepartment) {
      return errorResponse(
        res,
        400,
        "Department with this name already exists"
      );
    }

    const existingOrganization = await Organization.findById(organization_id);
    if (!existingOrganization) {
      return errorResponse(res, 404, "Organization not found");
    }

    const department = new Department(value);
    await department.save();

    return successResponse(res, department, "Department created successfully");
  } catch (error) {
    return catchResponse(res);
  }
}

// Update a department

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim(),
  is_active: Joi.boolean(),
});

async function updateDepartment(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, "Invalid department ID");
  }

  const { error, value } = updateDepartmentSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return errorResponse(res, 400, errors);
  }

  if (!value.name && !value.description && value.is_active === undefined) {
    return errorResponse(
      res,
      400,
      "Please provide name or description to update"
    );
  }

  try {
    const department = await Department.findOneAndUpdate({ _id: id }, value, {
      new: true,
    });
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(res, department, "Department updated successfully");
  } catch (error) {
    return catchResponse(res);
  }
}

// Get all departments
// Get all departments
async function getAllOrganizationDepartments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

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
      hasPrevPage: hasPrevPage,
    };

    return successResponse(
      res,
      { departments, paginationInfo },
      "Departments retrieved successfully"
    );
  } catch (error) {
    return catchResponse(res);
  }
}

// Get a single department by ID
async function getDepartmentById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }

    const department = await Department.findOne({
      _id: id,
    });
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(
      res,
      department,
      "Department retrieved successfully"
    );
  } catch (error) {
    return catchResponse(res);
  }
}

// Delete a department
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
    return catchResponse(res);
  }
}

module.exports = {
  createDepartment,
  getAllOrganizationDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
