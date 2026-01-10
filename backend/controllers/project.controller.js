const mongoose = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const projectService = require("../services/project.service");
const boardService = require("../services/board.service");

/**
 * Create a new project
 * POST /projects/create
 */
const createProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await projectService.createProject(
      session,
      req.body,
      req.user
    );
    if (!result.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, result.code || 400, result.message);
    }

    // Create default board for the project
    const boardResult = await boardService.createDefaultBoard(
      session,
      result.project._id,
      req.user.organization_id,
      req.user._id
    );
    if (!boardResult.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, boardResult.code || 400, boardResult.message);
    }

    await session.commitTransaction();
    return successResponse(
      res,
      { project: result.project, board: boardResult.board },
      "Project created successfully",
      201
    );
  } catch (err) {
    console.error("Create Project Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};


/**
 * Get all projects with pagination
 * GET /projects/all
 */
const getAllProjects = async (req, res) => {
  try {
    const response = await projectService.getAllProjects(req.query, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(
      res,
      { projects: response.data, pagination: response.pagination },
      "Projects fetched successfully"
    );
  } catch (err) {
    console.error("Get All Projects Error:", err.message);
    return catchResponse(res);
  }
};

/**
 * Get project by ID
 * GET /projects/details/:id
 */
const getProjectById = async (req, res) => {
  try {
    const response = await projectService.getProjectById(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(res, response.data, "Project fetched successfully");
  } catch (err) {
    console.error("Get Project By Id Error:", err.message);
    return catchResponse(res);
  }
};

/**
 * Update a project
 * PATCH /projects/update/:id
 */
const updateProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProject(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Project updated successfully");
  } catch (err) {
    console.error("Update Project Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Delete a project (soft delete)
 * DELETE /projects/delete/:id
 */
const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.deleteProject(
      session,
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Project deleted successfully");
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};


/**
 * Add members/managers to a project
 * POST /projects/:id/members
 */
const addProjectMembers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.addProjectMembers(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Project members added successfully"
    );
  } catch (err) {
    console.error("Add Project Members Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Remove members/managers from a project
 * DELETE /projects/:id/members
 */
const removeProjectMembers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.removeProjectMembers(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Project members removed successfully"
    );
  } catch (err) {
    console.error("Remove Project Members Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Get project members and managers
 * GET /projects/:id/members
 */
const getProjectMembers = async (req, res) => {
  try {
    const response = await projectService.getProjectMembers(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(
      res,
      response.data,
      "Project members fetched successfully"
    );
  } catch (err) {
    console.error("Get Project Members Error:", err.message);
    return catchResponse(res);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMembers,
  removeProjectMembers,
  getProjectMembers,
};
