const Department = require("../models/department.model");
const Organization = require("../models/organization.model");
const {
  departmentSchema,
  deleteDepartmentSchema,
} = require("../validators/department.validator");
const { isValidObjectId } = require("mongoose");
const {
  updateDepartmentSchema,
} = require("../validators/department.validator");
const User = require("../models/user.model");

// Create Department service
const createDepartment = async (body, userData) => {
  try {
    const { organization_id } = userData;
    const { error, value } = departmentSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { name } = value;
    const existingDepartment = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      organization_id,
    });

    if (existingDepartment) {
      return {
        isSuccess: false,
        message: "Department with this name already exists",
        code: 400,
      };
    }

    const existingOrganization = await Organization.findById(organization_id);
    if (!existingOrganization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }
    const department = new Department({ ...value, organization_id });
    await department.save();

    return { isSuccess: true, data: department };
  } catch (error) {
    console.error("Create Department Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update Department service
const updateDepartment = async (id, body, userData) => {
  try {
    const { organization_id } = userData;
    if (!id) {
      return {
        isSuccess: false,
        message: "Department ID is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid department ID", code: 400 };
    }

    const { error, value } = updateDepartmentSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    if (!value.name && !value.description && value.is_active === undefined) {
      return {
        isSuccess: false,
        message: "Please provide name or description to update",
        code: 400,
      };
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const department = await Department.findOneAndUpdate(query, value, {
      new: true,
    });
    if (!department) {
      return { isSuccess: false, message: "Department not found", code: 404 };
    }
    return { isSuccess: true, data: department };
  } catch (error) {
    console.error("Update Department Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get All Departments service
const getAllDepartments = async (req_query, userData) => {
  try {
    const { organization_id } = userData;
    const {
      page = 1,
      limit = 10,
      is_active,
      name,
      sort_by = "created_at",
      order = "desc",
    } = req_query;
    const pageNumber = Number.isInteger(parseInt(page, 10))
      ? parseInt(page, 10)
      : 1;
    const limitNumber = Number.isInteger(parseInt(limit, 10))
      ? parseInt(limit, 10)
      : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const query = {};
    if (organization_id) {
      query.organization_id = organization_id;
    }
    if (is_active === "true" || is_active === "false") {
      query.is_active = is_active === "true";
    }
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    const [departments, totalDepartments] = await Promise.all([
      Department.find(query)
        .collation({ locale: "en", strength: 2 })
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber),
      Department.countDocuments(query),
    ]);

    if (!departments.length) {
      return { isSuccess: false, message: "Departments not found", code: 404 };
    }

    const totalPages = Math.ceil(totalDepartments / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      totalItems: totalDepartments,
      totalPages: totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
    };

    return { isSuccess: true, data: departments, pagination };
  } catch (error) {
    console.error("Get All Departments Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get All Department Names service
const getAllDepartmentNames = async (userData) => {
  try {
    const { organization_id } = userData;
    const query = { is_active: true };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const departments = await Department.find(query).select("name");
    return { isSuccess: true, data: departments };
  } catch (err) {
    console.error("Get All Department Names Error: ", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get Department By ID service
const getDepartmentById = async (id, userData) => {
  try {
    const { organization_id } = userData;
    if (!id) {
      return {
        isSuccess: false,
        message: "Department ID is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid department ID", code: 400 };
    }

    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }

    const department = await Department.findOne(query);
    if (!department) {
      return { isSuccess: false, message: "Department not found", code: 404 };
    }
    return { isSuccess: true, data: department };
  } catch (error) {
    console.error("Get Department by ID Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete Department service
const deleteDepartment = async (session, id, body, userData) => {
  try {
    const { organization_id } = userData;
    const { error, value } = deleteDepartmentSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const { replace_department_id } = value;

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid department ID", code: 400 };
    }

    const department = await Department.findOne({
      _id: id,
      organization_id,
    }).session(session);
    if (!department) {
      return { isSuccess: false, message: "Department not found", code: 404 };
    }

    if (replace_department_id) {
      if (!isValidObjectId(replace_department_id)) {
        return {
          isSuccess: false,
          message: "Invalid replace_department_id",
          code: 400,
        };
      }

      const replaceDepartment = await Department.findOne({
        _id: replace_department_id,
        organization_id,
      }).session(session);
      if (!replaceDepartment) {
        return {
          isSuccess: false,
          message: "Replace department not found",
          code: 404,
        };
      }

      const userUpdate = await User.updateMany(
        { department: id, organization_id },
        { department: replace_department_id }
      ).session(session);

      if (userUpdate.modifiedCount === 0) {
        return {
          isSuccess: false,
          message: "No user found with this department",
          code: 404,
        };
      }
    } else {
      const userExist = await User.findOne({
        department: id,
        organization_id,
      }).session(session);
      if (userExist) {
        return { isSuccess: false, message: "Department has users", code: 400 };
      }
    }

    await Department.findOneAndDelete({ _id: id, organization_id }).session(
      session
    );
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Department Error: ", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// get users count by department ID
const getUsersCountByDepartmentId = async (id, userData) => {
  try {
    const { organization_id } = userData;
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid department ID", code: 400 };
    }
    const query = { department: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const usersCount = await User.countDocuments(query);
    return { isSuccess: true, data: usersCount };
  } catch (err) {
    console.error("Get Users Count by Department ID Error: ", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  createDepartment,
  updateDepartment,
  getAllDepartments,
  getAllDepartmentNames,
  getDepartmentById,
  deleteDepartment,
  getUsersCountByDepartmentId,
};
