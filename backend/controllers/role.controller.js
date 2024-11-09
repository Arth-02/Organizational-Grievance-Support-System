const Role = require("../models/role.model");
const User = require("../models/user.model");
const { PERMISSIONS, VIEW_PERMISSION } = require("../utils/constant");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { isValidObjectId, default: mongoose } = require("mongoose");
const { deleteRoleSchema } = require("../validators/role.validator");
const roleService = require("../services/role.service");

// create a new role
const createRole = async (req, res) => {
  try {
    const response = await roleService.createRole(req.body, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Role created successfully",
      201
    );
  } catch (err) {
    console.error("Error creating role: ", err);
    return catchResponse(res);
  }
};

// update role
const updateRole = async (req, res) => {
  try {
    const response = await roleService.updateRole(
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Role updated successfully");
  } catch (err) {
    console.error("Error updating role: ", err);
    return catchResponse(res);
  }
};

// get role by id
const getRoleById = async (req, res) => {
  try {
    const response = await roleService.getRoleById(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Role retrieved successfully");
  } catch (err) {
    console.error("Error getting role by id: ", err);
    return catchResponse(res);
  }
};

// get all roles name and id
const getAllRoleName = async (req, res) => {
  try {
    const response = await roleService.getAllRoleName(req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Roles retrieved successfully");
  } catch (err) {
    console.error("Error getting all roles name: ", err);
    return catchResponse(res);
  }
};

// get all roles in pagination
const getAllRoles = async (req, res) => {
  try {
    const response = await roleService.getAllRoles(req.user, req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { roles: response.data, pagination: response.pagination },
      "Roles retrieved successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// delete role
const deleteRole = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await roleService.deleteRole(
      session,
      req.params.id,
      req.user,
      req.body
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Role deleted successfully");
  } catch (err) {
    await session.abortTransaction();
    console.error("Error deleting role: ", err);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get count of users by role id
const getUsersCountByRoleId = async (req, res) => {
  try {
    const response = await roleService.getUsersCountByRoleId(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Users count retrieved successfully"
    );
  } catch (err) {
    console.error("Error getting users count by role id: ", err);
    return catchResponse(res);
  }
};

// Export the function
module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getAllRoleName,
  getAllRoles,
  getUsersCountByRoleId,
};
