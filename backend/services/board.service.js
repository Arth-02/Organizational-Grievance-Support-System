const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const Board = require("../models/board.model");
const Project = require("../models/project.model");
const {
  createBoardSchema,
  updateBoardSchema,
} = require("../validators/board.validator");

/**
 * Default columns for a new board
 */
const DEFAULT_COLUMNS = [
  { key: "todo", label: "To Do", order: 0 },
  { key: "in-progress", label: "In Progress", order: 1 },
  { key: "done", label: "Done", order: 2 },
];

/**
 * Create a default board for a project
 * @param {Object} session - MongoDB session for transaction
 * @param {String} projectId - Project ID
 * @param {String} organizationId - Organization ID
 * @param {String} userId - User ID who created the project
 * @returns {Object} - Result with isSuccess, board/message, code
 */
const createDefaultBoard = async (session, projectId, organizationId, userId) => {
  try {
    if (!projectId || !isValidObjectId(projectId)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    if (!organizationId || !isValidObjectId(organizationId)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const newBoard = new Board({
      organization_id: organizationId,
      project_id: projectId,
      name: "Default Board",
      columns: DEFAULT_COLUMNS,
      created_by: userId,
      is_active: true,
    });

    await newBoard.save({ session });

    return { isSuccess: true, board: newBoard };
  } catch (err) {
    console.error("Error in createDefaultBoard service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Create a custom board for a project
 * @param {Object} session - MongoDB session for transaction
 * @param {Object} body - Board data
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, board/message, code
 */
const createBoard = async (session, body, user) => {
  try {
    const { error, value } = createBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { organization_id, _id: userId } = user;
    const { project_id, name, columns } = value;

    // Validate project exists and belongs to the user's organization
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Project not found or does not belong to this organization",
        code: 404,
      };
    }

    const newBoard = new Board({
      organization_id,
      project_id,
      name,
      columns,
      created_by: userId,
      is_active: true,
    });

    await newBoard.save({ session });

    return { isSuccess: true, board: newBoard };
  } catch (err) {
    console.error("Error in createBoard service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};


/**
 * Get board by ID
 * @param {String} id - Board ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const getBoardById = async (id, user) => {
  try {
    const { organization_id } = user;

    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid board ID", code: 400 };
    }

    const board = await Board.findOne({
      _id: id,
      organization_id,
    })
      .populate({ path: "project_id", select: "name key" })
      .populate({ path: "created_by", select: "username email" });

    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }

    return { isSuccess: true, data: board };
  } catch (err) {
    console.error("Error in getBoardById service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Get all boards for a project
 * @param {String} projectId - Project ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const getBoardsByProject = async (projectId, user) => {
  try {
    const { organization_id } = user;

    if (!projectId) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }

    if (!isValidObjectId(projectId)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    // Verify project exists and belongs to the user's organization
    const project = await Project.findOne({
      _id: projectId,
      organization_id,
      deleted_at: null,
    });

    if (!project) {
      return {
        isSuccess: false,
        message: "Project not found or does not belong to this organization",
        code: 404,
      };
    }

    const boards = await Board.find({
      project_id: projectId,
      organization_id,
    })
      .populate({ path: "created_by", select: "username email" })
      .sort({ created_at: -1 });

    return { isSuccess: true, data: boards };
  } catch (err) {
    console.error("Error in getBoardsByProject service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Update a board
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Board ID
 * @param {Object} body - Update data
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const updateBoard = async (session, id, body, user) => {
  try {
    const { organization_id } = user;

    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid board ID", code: 400 };
    }

    const { error, value } = updateBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const board = await Board.findOne({
      _id: id,
      organization_id,
    }).session(session);

    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }

    // If columns are being updated, ensure order integrity
    if (value.columns) {
      // Sort columns by order to maintain integrity
      value.columns.sort((a, b) => a.order - b.order);
    }

    // Apply updates
    Object.assign(board, value);
    await board.save({ session });

    const updatedBoard = await Board.findById(id)
      .populate({ path: "project_id", select: "name key" })
      .populate({ path: "created_by", select: "username email" })
      .session(session);

    return { isSuccess: true, data: updatedBoard };
  } catch (err) {
    console.error("Error in updateBoard service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Deactivate a board (soft delete)
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Board ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, message, code
 */
const deactivateBoard = async (session, id, user) => {
  try {
    const { organization_id } = user;

    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid board ID", code: 400 };
    }

    const board = await Board.findOne({
      _id: id,
      organization_id,
    }).session(session);

    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }

    // Set is_active to false without deleting associated tasks
    board.is_active = false;
    await board.save({ session });

    return { isSuccess: true, message: "Board deactivated successfully" };
  } catch (err) {
    console.error("Error in deactivateBoard service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  createDefaultBoard,
  createBoard,
  getBoardById,
  getBoardsByProject,
  updateBoard,
  deactivateBoard,
  DEFAULT_COLUMNS,
};
