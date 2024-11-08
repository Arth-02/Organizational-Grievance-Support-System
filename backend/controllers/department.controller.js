const mongoose = require("mongoose");
const {
  errorResponse,
  catchResponse,
  successResponse,
} = require("../utils/response");
const departmentService = require("../services/department.service");

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const response = await departmentService.createDepartment(
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Department created successfully"
    );
  } catch (error) {
    console.error("Create Department Error: ", error);
    return catchResponse(res);
  }
};

// Update a department
const updateDepartment = async (req, res) => {
  try {
    const response = await departmentService.updateDepartment(
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Department updated successfully"
    );
  } catch (error) {
    console.error("Update Department Error: ", error);
    return catchResponse(res);
  }
};

// Get all departments in pagination
const getAllDepartment = async (req, res) => {
  try {
    const response = await departmentService.getAllDepartments(
      req.query,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      { departments: response.data, pagination: response.pagination },
      "Departments retrieved successfully"
    );
  } catch (error) {
    console.error("Get All Departments Error: ", error);
    return catchResponse(res);
  }
};

// get all departments name
const getAllDepartmentName = async (req, res) => {
  try {
    const response = await departmentService.getAllDepartmentNames(req.user);
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Departments retrieved successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// Get a single department by ID
const getDepartmentById = async (req, res) => {
  try {
    const response = await departmentService.getDepartmentById(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Department retrieved successfully"
    );
  } catch (error) {
    console.error("Get Department by ID Error: ", error);
    return catchResponse(res);
  }
};

// Delete a department
const deleteDepartment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await departmentService.deleteDepartment(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
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

// get users count by department ID
const getUsersCountByDepartmentId = async (req, res) => {
  try {
    const response = await departmentService.getUsersCountByDepartmentId(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Users count retrieved successfully"
    );
  } catch (err) {
    console.error("Get Users Count by Department ID Error: ", err);
    return catchResponse(res);
  }
};

module.exports = {
  createDepartment,
  getAllDepartment,
  getAllDepartmentName,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getUsersCountByDepartmentId,
};
