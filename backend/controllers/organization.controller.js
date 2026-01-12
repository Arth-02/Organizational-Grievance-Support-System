const mongoose = require("mongoose");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const organizationService = require("../services/organization.service");

// Create a new organization
const createOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await organizationService.createOrganization(
      session,
      req.body,
      req.files
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Organization applied successfully",
      201
    );
  } catch (err) {
    console.error("Error creating organization: ", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update an organization
const updateOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await organizationService.updateOrganization(
      session,
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
      "Organization updated successfully"
    );
  } catch (err) {
    console.error(err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get by id
const getOrganizationById = async (req, res) => {
  try {
    const response = await organizationService.getOrganizationById(
      req.params.id
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Organization found");
  } catch (err) {
    console.error("Error getting organization by id: ", err);
    return catchResponse(res);
  }
};

// delete organization (soft delete)
const deleteOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await organizationService.deleteOrganization(
      session,
      req.userData.organization_id
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, null, "Organization deleted successfully");
  } catch (err) {
    console.error("Error deleting organization: ", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createOrganization,
  updateOrganization,
  getOrganizationById,
  deleteOrganization,
};
