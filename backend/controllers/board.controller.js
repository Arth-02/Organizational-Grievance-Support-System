const mongoose = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const boardService = require("../services/board.service");

/**
 * Create a custom board for a project
 * POST /boards/create
 */
const createBoard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await boardService.createBoard(session, req.body, req.user);
    if (!result.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, result.code || 400, result.message);
    }
    await session.commitTransaction();
    return successResponse(res, result.board, "Board created successfully", 201);
  } catch (err) {
    console.error("Create Board Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Get all boards for a project
 * GET /boards/project/:projectId
 */
const getBoardsByProject = async (req, res) => {
  try {
    const response = await boardService.getBoardsByProject(
      req.params.projectId,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(res, response.data, "Boards fetched successfully");
  } catch (err) {
    console.error("Get Boards By Project Error:", err.message);
    return catchResponse(res);
  }
};


/**
 * Get board by ID
 * GET /boards/details/:id
 */
const getBoardById = async (req, res) => {
  try {
    const response = await boardService.getBoardById(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(res, response.data, "Board fetched successfully");
  } catch (err) {
    console.error("Get Board By Id Error:", err.message);
    return catchResponse(res);
  }
};

/**
 * Update a board
 * PATCH /boards/update/:id
 */
const updateBoard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.updateBoard(
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
    return successResponse(res, response.data, "Board updated successfully");
  } catch (err) {
    console.error("Update Board Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Deactivate a board (soft delete)
 * PATCH /boards/deactivate/:id
 */
const deactivateBoard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.deactivateBoard(
      session,
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Board deactivated successfully");
  } catch (err) {
    console.error("Deactivate Board Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createBoard,
  getBoardsByProject,
  getBoardById,
  updateBoard,
  deactivateBoard,
};
