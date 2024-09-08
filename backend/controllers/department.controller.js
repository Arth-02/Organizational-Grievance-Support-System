const mongoose = require("mongoose");
const Department = require("../models/department.model");
const Organization = require("../models/organization.model");
const User = require("../models/user.model");
const {
  errorResponse,
  catchResponse,
  successResponse,
} = require("../utils/response");
const { isValidObjectId } = require("mongoose");
const {
  departmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema,
} = require("../validators/department.validator");

// Create a new department
async function createDepartment(req, res) {
  try {
    const { error, value } = departmentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const { organization_id } = req.user;

    const { name } = value;
    const existingDepartment = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      organization_id,
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
    const department = new Department({ ...value, organization_id });
    await department.save();

    return successResponse(
      res,
      department,
      "Department created successfully",
      201
    );
  } catch (error) {
    console.log(error);
    return catchResponse(res);
  }
}

// Update a department
async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    if (!isValidObjectId(id)) {
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

    const department = await Department.findOneAndUpdate(
      { _id: id, organization_id },
      value,
      {
        new: true,
      }
    );
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }
    return successResponse(res, department, "Department updated successfully");
  } catch (error) {
    return catchResponse(res);
  }
}

// Get all departments
async function getAllOrganizationDepartments(req, res) {
  try {
    const { organization_id } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalDepartments = await Department.countDocuments({
      organization_id,
    });
    const departments = await Department.find({ organization_id })
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
    const { organization_id } = req.user;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }

    const department = await Department.findOne({
      _id: id,
      organization_id,
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

const deleteDepartment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { organization_id } = req.user;
    const { error, value } = deleteDepartmentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const id = req.params.id;

    const { replace_department_id } = value;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }

    const department = await Department.findOne({
      _id: id,
      organization_id,
    }).session(session);
    if (!department) {
      return errorResponse(res, 404, "Department not found");
    }

    if (replace_department_id) {
      if (!isValidObjectId(replace_department_id)) {
        return errorResponse(res, 400, "Invalid replace_department_id");
      }

      const replaceDepartment = await Department.findOne({
        _id: replace_department_id,
        organization_id,
      }).session(session);
      if (!replaceDepartment) {
        return errorResponse(res, 404, "Replace department not found");
      }

      const userUpdate = await User.updateMany(
        { department: id, organization_id },
        { department: replace_department_id }
      ).session(session);

      if (userUpdate.modifiedCount === 0) {
        return errorResponse(res, 404, "No users found to update");
      }
    } else {
      const userExist = await User.findOne({
        department: id,
        organization_id,
      }).session(session);
      if (userExist) {
        return errorResponse(res, 400, "Department is assigned to a user");
      }
    }

    await Department.findOneAndDelete({ _id: id, organization_id }).session(
      session
    );
    await session.commitTransaction();
    return successResponse(res, {}, "Department deleted successfully");
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createDepartment,
  getAllOrganizationDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
