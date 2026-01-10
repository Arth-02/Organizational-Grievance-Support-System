const mongoose = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const taskService = require("../services/task.service");

/**
 * Create a new task
 * POST /tasks/create
 */
const createTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await taskService.createTask(
      session,
      req.body,
      req.user
    );
    if (!result.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, result.code || 400, result.message);
    }
    await session.commitTransaction();
    return successResponse(res, result.task, "Task created successfully", 201);
  } catch (err) {
    console.error("Create Task Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Get tasks by project with filters and pagination
 * GET /tasks/project/:projectId
 */
const getTasksByProject = async (req, res) => {
  try {
    const response = await taskService.getTasksByProject(
      req.params.projectId,
      req.query,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(
      res,
      { tasks: response.data, pagination: response.pagination },
      "Tasks fetched successfully"
    );
  } catch (err) {
    console.error("Get Tasks By Project Error:", err.message);
    return catchResponse(res);
  }
};


/**
 * Get task by ID
 * GET /tasks/details/:id
 */
const getTaskById = async (req, res) => {
  try {
    const response = await taskService.getTaskById(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 400, response.message);
    }
    return successResponse(res, response.data, "Task fetched successfully");
  } catch (err) {
    console.error("Get Task By Id Error:", err.message);
    return catchResponse(res);
  }
};

/**
 * Update a task
 * PATCH /tasks/update/:id
 */
const updateTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.updateTask(
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
    return successResponse(res, response.data, "Task updated successfully");
  } catch (err) {
    console.error("Update Task Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Update task status with rank recalculation
 * PATCH /tasks/status/:id
 */
const updateTaskStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.updateTaskStatus(
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
      "Task status updated successfully"
    );
  } catch (err) {
    console.error("Update Task Status Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Delete a task
 * DELETE /tasks/delete/:id
 */
const deleteTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.deleteTask(
      session,
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Task deleted successfully");
  } catch (err) {
    console.error("Delete Task Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};


/**
 * Add a comment to a task
 * POST /tasks/:id/comments
 */
const addComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.addComment(
      session,
      req.params.id,
      req.body,
      req.user,
      req.files || []
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Comment added successfully", 201);
  } catch (err) {
    console.error("Add Comment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Update a comment on a task
 * PATCH /tasks/:id/comments/:commentId
 */
const updateComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.updateComment(
      session,
      req.params.id,
      req.params.commentId,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Comment updated successfully");
  } catch (err) {
    console.error("Update Comment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Delete a comment from a task
 * DELETE /tasks/:id/comments/:commentId
 */
const deleteComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.deleteComment(
      session,
      req.params.id,
      req.params.commentId,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Comment deleted successfully");
  } catch (err) {
    console.error("Delete Comment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};


/**
 * Add attachments to a task
 * POST /tasks/:id/attachments
 */
const addAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.addAttachment(
      session,
      req.params.id,
      req.user,
      req.files || []
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Attachment added successfully",
      201
    );
  } catch (err) {
    console.error("Add Attachment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

/**
 * Remove an attachment from a task
 * DELETE /tasks/:id/attachments/:attachmentId
 */
const removeAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await taskService.removeAttachment(
      session,
      req.params.id,
      req.params.attachmentId,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code || 400, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Attachment removed successfully");
  } catch (err) {
    console.error("Remove Attachment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  removeAttachment,
};
