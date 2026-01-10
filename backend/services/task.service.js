const { isValidObjectId } = require("mongoose");
const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Board = require("../models/board.model");
const User = require("../models/user.model");
const LexoRank = require("./lexorank.service");
const AttachmentService = require("./attachment.service");
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  commentSchema,
  updateCommentSchema,
} = require("../validators/task.validator");
const { sendNotification } = require("../utils/notification");

/**
 * Get all project member and manager IDs for notifications
 * @param {Object} project - Project document
 * @param {String} excludeUserId - User ID to exclude from notifications
 * @returns {Array} - Array of user IDs
 */
const getProjectUserIds = (project, excludeUserId) => {
  const userIds = new Set();

  // Add all members
  project.members.forEach((m) => userIds.add(m.toString()));

  // Add all managers
  project.manager.forEach((m) => userIds.add(m.toString()));

  // Remove the user who performed the action
  if (excludeUserId) {
    userIds.delete(excludeUserId.toString());
  }

  return Array.from(userIds);
};

/**
 * Generate a unique issue key for a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} projectId - Project ID
 * @returns {String} - Issue key in format PROJECT_KEY-N
 */
const generateIssueKey = async (session, projectId) => {
  const project = await Project.findById(projectId).session(session);
  if (!project) {
    throw new Error("Project not found");
  }

  // Find the last task in this project to get the sequence number
  const lastTask = await Task.findOne({ project_id: projectId })
    .sort({ created_at: -1 })
    .session(session);

  let sequence = 1;
  if (lastTask && lastTask.issue_key) {
    const parts = lastTask.issue_key.split("-");
    const lastNumber = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNumber)) {
      sequence = lastNumber + 1;
    }
  }

  return `${project.key}-${sequence}`;
};

/**
 * Check if user is a project member or manager
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @returns {Boolean} - True if user is member or manager
 */
const isProjectMemberOrManager = (project, userId) => {
  const userIdStr = userId.toString();
  const isMember = project.members.some((m) => m.toString() === userIdStr);
  const isManager = project.manager.some((m) => m.toString() === userIdStr);
  return isMember || isManager;
};

/**
 * Create a new task
 * @param {Object} session - MongoDB session for transaction
 * @param {Object} body - Task data
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, task/message, code
 */
const createTask = async (session, body, user) => {
  try {
    const { error, value } = createTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { organization_id, _id: userId } = user;
    const {
      project_id,
      type,
      title,
      description,
      status,
      priority,
      assignee,
      due_date,
    } = value;

    // Validate project exists and belongs to user's organization
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

    // Check if user is a project member or manager
    if (!isProjectMemberOrManager(project, userId)) {
      return {
        isSuccess: false,
        message: "You must be a project member or manager to create tasks",
        code: 403,
      };
    }

    // Validate assignee is a project member or manager
    if (assignee) {
      if (!isProjectMemberOrManager(project, assignee)) {
        return {
          isSuccess: false,
          message: "Assignee must be a project member or manager",
          code: 400,
        };
      }
    }

    // Validate status exists in board columns
    const board = await Board.findOne({
      project_id,
      organization_id,
      is_active: true,
    }).session(session);

    if (board) {
      const validStatuses = board.columns.map((col) => col.key);
      if (!validStatuses.includes(status)) {
        return {
          isSuccess: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
          code: 400,
        };
      }
    }

    // Generate issue key
    const issue_key = await generateIssueKey(session, project_id);

    // Calculate rank for the new task
    const lastTaskInStatus = await Task.findOne({
      project_id,
      status,
    })
      .sort({ rank: -1 })
      .session(session);

    let rank;
    if (lastTaskInStatus && lastTaskInStatus.rank) {
      rank = LexoRank.generateNextRank(lastTaskInStatus.rank);
    } else {
      rank = LexoRank.getInitialRank();
    }

    // Create the task
    const newTask = new Task({
      project_id,
      issue_key,
      type,
      title,
      description,
      status,
      priority,
      assignee,
      reporter: userId,
      due_date,
      rank,
      activity: [
        {
          action: "created",
          performed_by: userId,
          performed_at: new Date(),
        },
      ],
    });

    await newTask.save({ session });

    // Populate references for response
    const populatedTask = await Task.findById(newTask._id)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .session(session);

    // Send notification to all project members/managers except the creator
    const userIds = getProjectUserIds(project, userId);
    if (userIds.length > 0) {
      sendNotification(userIds, {
        type: "task_created",
        message: `New task ${populatedTask.issue_key} has been created`,
        taskId: populatedTask._id,
        projectId: project_id,
        updatedData: populatedTask,
      });
    }

    return { isSuccess: true, task: populatedTask };
  } catch (err) {
    console.error("Error in createTask service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Get task by ID
 * @param {String} id - Task ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const getTaskById = async (id, user) => {
  try {
    const { organization_id } = user;

    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    const task = await Task.findById(id)
      .populate({
        path: "assignee",
        select: "username email avatar firstname lastname",
      })
      .populate({
        path: "reporter",
        select: "username email avatar firstname lastname",
      })
      .populate({ path: "attachments" })
      .populate({ path: "comments.author", select: "username email avatar" })
      .populate({
        path: "activity.performed_by",
        select: "username email avatar",
      });

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    });

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    return { isSuccess: true, data: task };
  } catch (err) {
    console.error("Error in getTaskById service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Get tasks by project with filters and pagination
 * @param {String} projectId - Project ID
 * @param {Object} query - Query parameters
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/pagination/message, code
 */
const getTasksByProject = async (projectId, query, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!projectId) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }

    if (!isValidObjectId(projectId)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    // Verify project exists and belongs to user's organization
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

    const {
      page = 1,
      limit = 50,
      status,
      priority,
      assignee,
      reporter,
      type,
      search,
      my_tasks,
      sort_by = "rank",
      order = "asc",
      my_filter,
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 50;
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter = { project_id: projectId };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }
    if (assignee) {
      if (!isValidObjectId(assignee)) {
        return { isSuccess: false, message: "Invalid assignee ID", code: 400 };
      }
      filter.assignee = assignee;
    }
    // Filter for "assigned to me" or "reported by me"
    if (my_filter === "assigned_to_me") {
      filter.assignee = userId;
    } else if (my_filter === "reported_by_me") {
      filter.reporter = userId;
    }

    if (reporter) {
      if (!isValidObjectId(reporter)) {
        return { isSuccess: false, message: "Invalid reporter ID", code: 400 };
      }
      filter.reporter = reporter;
    }

    if (type) {
      filter.type = type;
    }

    // "My tasks" filter - tasks where user is assignee or reporter
    if (my_tasks === "true" || my_tasks === true) {
      filter.$or = [{ assignee: user._id }, { reporter: user._id }];
    }

    // Text search on title and description
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { issue_key: { $regex: search, $options: "i" } },
        ],
      });
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const sortOptions = { [sort_by]: sortOrder };

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .populate({ path: "assignee", select: "username email avatar" })
        .populate({ path: "reporter", select: "username email avatar" }),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalTasks / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    const pagination = {
      totalItems: totalTasks,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    };

    return { isSuccess: true, data: tasks, pagination };
  } catch (err) {
    console.error("Error in getTasksByProject service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Update a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Task ID
 * @param {Object} body - Update data
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const updateTask = async (session, id, body, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    const { error, value } = updateTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const task = await Task.findById(id).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member, manager, or task assignee
    const isAuthorized =
      isProjectMemberOrManager(project, userId) ||
      (task.assignee && task.assignee.toString() === userId.toString());

    if (!isAuthorized) {
      return {
        isSuccess: false,
        message: "You are not authorized to update this task",
        code: 403,
      };
    }

    // Validate assignee if being updated
    if (value.assignee !== undefined && value.assignee !== null) {
      if (!isProjectMemberOrManager(project, value.assignee)) {
        return {
          isSuccess: false,
          message: "Assignee must be a project member or manager",
          code: 400,
        };
      }
    }

    // Track changes for activity log
    const activities = [];
    const now = new Date();

    // Check for priority change
    if (value.priority !== undefined && value.priority !== task.priority) {
      activities.push({
        action: "priority_changed",
        field: "priority",
        from: task.priority,
        to: value.priority,
        performed_by: userId,
        performed_at: now,
      });
    }

    // Check for assignee change
    if (value.assignee !== undefined) {
      const oldAssigneeId = task.assignee ? task.assignee.toString() : null;
      const newAssigneeId = value.assignee ? value.assignee.toString() : null;
      if (oldAssigneeId !== newAssigneeId) {
        // Fetch user data for old and new assignee to store in activity
        let oldAssigneeData = null;
        let newAssigneeData = null;

        if (oldAssigneeId) {
          const oldUser = await User.findById(oldAssigneeId)
            .select("username email avatar firstname lastname")
            .session(session);
          if (oldUser) {
            oldAssigneeData = {
              _id: oldUser._id,
              username: oldUser.username,
              firstname: oldUser.firstname,
              lastname: oldUser.lastname,
              avatar: oldUser.avatar,
            };
          }
        }

        if (newAssigneeId) {
          const newUser = await User.findById(newAssigneeId)
            .select("username email avatar firstname lastname")
            .session(session);
          if (newUser) {
            newAssigneeData = {
              _id: newUser._id,
              username: newUser.username,
              firstname: newUser.firstname,
              lastname: newUser.lastname,
              avatar: newUser.avatar,
            };
          }
        }

        activities.push({
          action: "assignee_changed",
          field: "assignee",
          from: oldAssigneeData,
          to: newAssigneeData,
          performed_by: userId,
          performed_at: now,
        });
      }
    }

    // Check for other field updates
    const trackedFields = ["title", "description", "due_date", "type"];
    for (const field of trackedFields) {
      if (value[field] !== undefined && value[field] !== task[field]) {
        activities.push({
          action: "updated",
          field,
          from: task[field],
          to: value[field],
          performed_by: userId,
          performed_at: now,
        });
      }
    }

    // Apply updates
    Object.assign(task, value);

    // Add activities to task
    if (activities.length > 0) {
      task.activity.push(...activities);
    }

    await task.save({ session });

    // Populate references for response
    const updatedTask = await Task.findById(id)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .session(session);

    // Send notification to all project members/managers except the updater
    const userIds = getProjectUserIds(project, userId);
    if (userIds.length > 0) {
      sendNotification(userIds, {
        type: "update_task",
        message: `Task ${updatedTask.issue_key} has been updated`,
        taskId: id,
        projectId: task.project_id,
        updatedData: updatedTask,
      });
    }

    return { isSuccess: true, data: updatedTask };
  } catch (err) {
    console.error("Error in updateTask service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Delete a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Task ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, message, code
 */
const deleteTask = async (session, id, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    const task = await Task.findById(id).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member or manager
    if (!isProjectMemberOrManager(project, userId)) {
      return {
        isSuccess: false,
        message: "You are not authorized to delete this task",
        code: 403,
      };
    }

    // Store task info before deletion for notification
    const taskStatus = task.status;
    const taskIssueKey = task.issue_key;
    const taskProjectId = task.project_id;

    // Delete the task
    await Task.deleteOne({ _id: id }).session(session);

    // Send notification to all project members/managers except the deleter
    const userIds = getProjectUserIds(project, userId);
    if (userIds.length > 0) {
      sendNotification(userIds, {
        type: "delete_task",
        message: `Task ${taskIssueKey} has been deleted`,
        taskId: id,
        projectId: taskProjectId,
        status: taskStatus,
      });
    }

    return { isSuccess: true, message: "Task deleted successfully" };
  } catch (err) {
    console.error("Error in deleteTask service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Update task status with rank recalculation
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Task ID
 * @param {Object} body - Status update data with optional prevRank and nextRank
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const updateTaskStatus = async (session, id, body, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    const { error, value } = updateTaskStatusSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { status, prevRank, nextRank } = value;

    const task = await Task.findById(id).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member, manager, or task assignee
    const isAuthorized =
      isProjectMemberOrManager(project, userId) ||
      (task.assignee && task.assignee.toString() === userId.toString());

    if (!isAuthorized) {
      return {
        isSuccess: false,
        message: "You are not authorized to update this task",
        code: 403,
      };
    }

    // Validate status exists in board columns
    const board = await Board.findOne({
      project_id: task.project_id,
      organization_id,
      is_active: true,
    }).session(session);

    if (board) {
      const validStatuses = board.columns.map((col) => col.key);
      if (!validStatuses.includes(status)) {
        return {
          isSuccess: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
          code: 400,
        };
      }
    }

    const oldStatus = task.status;
    let newRank;

    // Calculate new rank based on position
    if (prevRank && nextRank) {
      // Insert between two tasks
      newRank = LexoRank.getMiddleRank(prevRank, nextRank);
    } else if (prevRank && !nextRank) {
      // Insert after a task (at the end)
      newRank = LexoRank.generateNextRank(prevRank);
    } else if (!prevRank && nextRank) {
      // Insert before a task (at the beginning)
      newRank = LexoRank.getMiddleRank(null, nextRank);
    } else {
      // No position specified, add to end of column
      const lastTaskInStatus = await Task.findOne({
        project_id: task.project_id,
        status,
        _id: { $ne: id },
      })
        .sort({ rank: -1 })
        .session(session);

      if (lastTaskInStatus && lastTaskInStatus.rank) {
        newRank = LexoRank.generateNextRank(lastTaskInStatus.rank);
      } else {
        newRank = LexoRank.getInitialRank();
      }
    }

    // Record activity if status changed
    if (oldStatus !== status) {
      task.activity.push({
        action: "status_changed",
        field: "status",
        from: oldStatus,
        to: status,
        performed_by: userId,
        performed_at: new Date(),
      });
    }

    // Update task
    task.status = status;
    task.rank = newRank;

    await task.save({ session });

    // Populate references for response
    const updatedTask = await Task.findById(id)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .session(session);

    // Send notification to all project members/managers except the updater
    const userIds = getProjectUserIds(project, userId);
    if (userIds.length > 0) {
      sendNotification(userIds, {
        type: "update_task_status",
        message: `Task ${updatedTask.issue_key} status changed to ${status}`,
        taskId: id,
        projectId: task.project_id,
        updatedData: updatedTask,
        oldStatus,
      });
    }

    return { isSuccess: true, data: updatedTask };
  } catch (err) {
    console.error("Error in updateTaskStatus service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Add a comment to a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} taskId - Task ID
 * @param {Object} body - Comment data
 * @param {Object} user - Current user
 * @param {Array} files - Optional attachment files
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const addComment = async (session, taskId, body, user, files = []) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!taskId) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(taskId)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    const { error, value } = commentSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const task = await Task.findById(taskId).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member or manager
    if (!isProjectMemberOrManager(project, userId)) {
      return {
        isSuccess: false,
        message: "You must be a project member or manager to add comments",
        code: 403,
      };
    }

    // Handle attachments if provided
    let attachmentIds = [];
    if (files && files.length > 0) {
      const attachmentResult = await AttachmentService.createAttachment(
        session,
        userId,
        organization_id,
        files
      );
      if (!attachmentResult.isSuccess) {
        return attachmentResult;
      }
      attachmentIds = attachmentResult.attachmentIds;
    }

    // Create the comment
    const newComment = {
      author: userId,
      message: value.message,
      attachments: attachmentIds,
      is_edited: false,
      edited_at: null,
    };

    task.comments.push(newComment);

    // Record activity
    task.activity.push({
      action: "comment_added",
      performed_by: userId,
      performed_at: new Date(),
    });

    await task.save({ session });

    // Populate and return the updated task
    const updatedTask = await Task.findById(taskId)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .populate({ path: "comments.author", select: "username email avatar" })
      .populate({ path: "comments.attachments" })
      .session(session);

    return { isSuccess: true, data: updatedTask };
  } catch (err) {
    console.error("Error in addComment service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Update a comment on a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} taskId - Task ID
 * @param {String} commentId - Comment ID
 * @param {Object} body - Updated comment data
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const updateComment = async (session, taskId, commentId, body, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!taskId) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(taskId)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    if (!commentId) {
      return { isSuccess: false, message: "Comment ID is required", code: 400 };
    }

    if (!isValidObjectId(commentId)) {
      return { isSuccess: false, message: "Invalid comment ID", code: 400 };
    }

    const { error, value } = updateCommentSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const task = await Task.findById(taskId).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Find the comment
    const comment = task.comments.id(commentId);

    if (!comment) {
      return { isSuccess: false, message: "Comment not found", code: 404 };
    }

    // Verify ownership: only the comment author can edit
    if (comment.author.toString() !== userId.toString()) {
      return {
        isSuccess: false,
        message: "You can only edit your own comments",
        code: 403,
      };
    }

    // Update the comment
    comment.message = value.message;
    comment.is_edited = true;
    comment.edited_at = new Date();

    await task.save({ session });

    // Populate and return the updated task
    const updatedTask = await Task.findById(taskId)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .populate({ path: "comments.author", select: "username email avatar" })
      .populate({ path: "comments.attachments" })
      .session(session);

    return { isSuccess: true, data: updatedTask };
  } catch (err) {
    console.error("Error in updateComment service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Delete a comment from a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} taskId - Task ID
 * @param {String} commentId - Comment ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, message, code
 */
const deleteComment = async (session, taskId, commentId, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!taskId) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(taskId)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    if (!commentId) {
      return { isSuccess: false, message: "Comment ID is required", code: 400 };
    }

    if (!isValidObjectId(commentId)) {
      return { isSuccess: false, message: "Invalid comment ID", code: 400 };
    }

    const task = await Task.findById(taskId).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Find the comment
    const comment = task.comments.id(commentId);

    if (!comment) {
      return { isSuccess: false, message: "Comment not found", code: 404 };
    }

    // Verify ownership: only the comment author can delete
    if (comment.author.toString() !== userId.toString()) {
      return {
        isSuccess: false,
        message: "You can only delete your own comments",
        code: 403,
      };
    }

    // Soft delete attachments if any
    if (comment.attachments && comment.attachments.length > 0) {
      await AttachmentService.deleteAttachment(session, comment.attachments);
    }

    // Remove the comment using pull
    task.comments.pull(commentId);

    await task.save({ session });

    // Populate and return the updated task
    const updatedTask = await Task.findById(taskId)
      .populate({
        path: "assignee",
        select: "username email avatar firstname lastname",
      })
      .populate({
        path: "reporter",
        select: "username email avatar firstname lastname",
      })
      .populate({ path: "comments.author", select: "username email avatar" })
      .populate({ path: "comments.attachments" })
      .populate({
        path: "activity.performed_by",
        select: "username email avatar",
      })
      .session(session);

    return {
      isSuccess: true,
      data: updatedTask,
      message: "Comment deleted successfully",
    };
  } catch (err) {
    console.error("Error in deleteComment service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Add attachments to a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} taskId - Task ID
 * @param {Object} user - Current user
 * @param {Array} files - Attachment files
 * @returns {Object} - Result with isSuccess, data/message, code
 */
const addAttachment = async (session, taskId, user, files) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!taskId) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(taskId)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    if (!files || files.length === 0) {
      return {
        isSuccess: false,
        message: "At least one file is required",
        code: 400,
      };
    }

    const task = await Task.findById(taskId).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member or manager
    if (!isProjectMemberOrManager(project, userId)) {
      return {
        isSuccess: false,
        message: "You must be a project member or manager to add attachments",
        code: 403,
      };
    }

    // Check attachment limit (configurable, default 20)
    const maxAttachments = process.env.MAX_TASK_ATTACHMENTS || 20;
    if (task.attachments.length + files.length > maxAttachments) {
      return {
        isSuccess: false,
        message: `Maximum ${maxAttachments} attachments allowed per task`,
        code: 400,
      };
    }

    // Upload attachments using Attachment Service
    const attachmentResult = await AttachmentService.createAttachment(
      session,
      userId,
      organization_id,
      files
    );

    if (!attachmentResult.isSuccess) {
      return attachmentResult;
    }

    // Add attachment IDs to task
    task.attachments.push(...attachmentResult.attachmentIds);

    // Record activity for each attachment added
    task.activity.push({
      action: "attachment_added",
      performed_by: userId,
      performed_at: new Date(),
    });

    await task.save({ session });

    // Populate and return the updated task
    const updatedTask = await Task.findById(taskId)
      .populate({ path: "assignee", select: "username email avatar" })
      .populate({ path: "reporter", select: "username email avatar" })
      .populate({ path: "attachments" })
      .session(session);

    return { isSuccess: true, data: updatedTask };
  } catch (err) {
    console.error("Error in addAttachment service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

/**
 * Remove an attachment from a task
 * @param {Object} session - MongoDB session for transaction
 * @param {String} taskId - Task ID
 * @param {String} attachmentId - Attachment ID
 * @param {Object} user - Current user
 * @returns {Object} - Result with isSuccess, message, code
 */
const removeAttachment = async (session, taskId, attachmentId, user) => {
  try {
    const { organization_id, _id: userId } = user;

    if (!taskId) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }

    if (!isValidObjectId(taskId)) {
      return { isSuccess: false, message: "Invalid task ID", code: 400 };
    }

    if (!attachmentId) {
      return {
        isSuccess: false,
        message: "Attachment ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(attachmentId)) {
      return { isSuccess: false, message: "Invalid attachment ID", code: 400 };
    }

    const task = await Task.findById(taskId).session(session);

    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    // Verify task belongs to user's organization via project
    const project = await Project.findOne({
      _id: task.project_id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return {
        isSuccess: false,
        message: "Task not found or does not belong to this organization",
        code: 404,
      };
    }

    // Check authorization: user must be project member or manager
    if (!isProjectMemberOrManager(project, userId)) {
      return {
        isSuccess: false,
        message:
          "You must be a project member or manager to remove attachments",
        code: 403,
      };
    }

    // Check if attachment exists in task
    const attachmentIndex = task.attachments.findIndex(
      (att) => att.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return {
        isSuccess: false,
        message: "Attachment not found in this task",
        code: 404,
      };
    }

    // Soft delete the attachment using Attachment Service
    const deleteResult = await AttachmentService.deleteAttachment(session, [
      attachmentId,
    ]);

    if (!deleteResult.isSuccess) {
      return deleteResult;
    }

    // Remove attachment ID from task
    task.attachments.splice(attachmentIndex, 1);

    await task.save({ session });

    return { isSuccess: true, message: "Attachment removed successfully" };
  } catch (err) {
    console.error("Error in removeAttachment service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  generateIssueKey,
  createTask,
  getTaskById,
  getTasksByProject,
  updateTask,
  deleteTask,
  updateTaskStatus,
  isProjectMemberOrManager,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  removeAttachment,
};
