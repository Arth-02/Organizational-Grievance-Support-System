const mongoose = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const grievanceService = require("../services/grievance.service");

const createGrievance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await grievanceService.createGrievance(
      session,
      req.body,
      req.user,
      req.files
    );
    if (!result.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, 400, result.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      result.grievance,
      "Grievance created successfully",
      201
    );
  } catch (err) {
    console.error("Create Grievance Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  }
};

// Update a grievance
const updateGrievance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievance(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update grievance assignee
const updateGrievanceAssignee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievanceAssignee(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance assignee updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Assignee Error:", err.stack);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update grievance Status
const updateGrievanceStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievanceStatus(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance status updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Status Error:", err.stack);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update grievance attachment
const updateGrievanceAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievanceAttachment(
      session,
      req.params.id,
      req.body,
      req.user,
      req.files
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Attachment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get grievance by id
const getGrievanceById = async (req, res) => {
  try {
    const response = await grievanceService.getGrievanceById(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Grievance fetched successfully"
    );
  } catch (err) {
    console.error("Get Grievance By Id Error:", err.message);
    return catchResponse(res);
  }
};

// delete grievance by id
const deleteGrievanceById = async (req, res) => {
  try {
    const response = await grievanceService.deleteGrievanceById(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, "Grievance deleted successfully");
  } catch (err) {
    console.error("Delete Grievance By Id Error:", err.message);
    return catchResponse(res);
  }
};

// get all grievances
const getAllGrievances = async (req, res) => {
  try {
    const response = await grievanceService.getAllGrievances(
      req.query,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { grievances: response.data, pagination: response.pagination },
      "Grievances fetched successfully"
    );
  } catch (err) {
    console.error("Get All Grievances Error:", err.message);
    return catchResponse(res);
  }
};
module.exports = {
  createGrievance,
  updateGrievance,
  updateGrievanceAssignee,
  updateGrievanceStatus,
  updateGrievanceAttachment,
  getGrievanceById,
  deleteGrievanceById,
  getAllGrievances,
};
