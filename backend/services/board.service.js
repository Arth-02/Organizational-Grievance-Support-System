const mongoose = require("mongoose");
const Board = require("../models/board.model");
const Task = require("../models/task.model");
const taskservice = require("./task.service");
const {
  updateBoardTagSchema,
  addAndDeleteBoardTagSchema,
  createBoardSchema,
  updateBoardSchema,
} = require("../validators/board.validator");
const { isValidObjectId } = mongoose;
const { addTaskSchema } = require("../validators/task.validator");

// Create a new board
const createBoard = async (session, organization_id, body) => {
  try {
    const { error, value } = createBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const { name } = value;
    const newBoard = new Board({ organization_id, name });
    const board = await newBoard.save({ session });
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Create Board Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board
const updateBoard = async (session, id, organization_id, body, user = null) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const { error, value } = updateBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, session }
    );
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Update Board Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get a board by ID
const getBoardById = async (id, organization_id) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({ _id: id, organization_id });
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Get Board By ID Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Add, Update and Delete a board tag
const updateBoardTag = async (
  session,
  id,
  organization_id,
  body,
  request,
  user = null
) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    let schema;
    if (request === "add" || request === "delete") {
      schema = addAndDeleteBoardTagSchema;
    } else if (request === "update") {
      schema = updateBoardTagSchema;
    }
    const { error, value } = schema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    if (request === "add") {
      const { tag } = value;
      if (board.tags.includes(tag)) {
        return { isSuccess: false, message: "Tag already exists", code: 400 };
      }
      board.tags.push(tag);
    } else if (request === "update") {
      const { oldtag, newtag } = body;
      const tagIndex = board.tags.indexOf(oldtag);
      if (tagIndex === -1) {
        return { isSuccess: false, message: "old Tag not found", code: 404 };
      }
      if (board.tags.includes(newtag)) {
        return {
          isSuccess: false,
          message: "new Tag already exists",
          code: 400,
        };
      }
      const response = await taskservice.updateTaskTag(
        session,
        board.tasks,
        oldtag,
        newtag
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      board.tags[tagIndex] = newtag;
    } else if (request === "delete") {
      const { tag } = value;
      const tagIndex = board.tags.indexOf(tag);
      if (tagIndex === -1) {
        return { isSuccess: false, message: "Tag not found", code: 404 };
      }
      // Check if any tasks exist with this tag
      if (board.tasks.length !== 0) {
        const tasksWithTag = await Task.countDocuments({
          _id: { $in: board.tasks },
          tag: tag,
        }).session(session);

        if (tasksWithTag > 0) {
          return {
            isSuccess: false,
            message: "Cannot delete list with tasks. Please move or delete all tasks first.",
            code: 400,
          };
        }
      }
      board.tags.splice(tagIndex, 1);
    }
    const updatedBoard = await board.save({ session });
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    if (request === "add") {
      console.error("Add Board Tag Error:", err.message);
    } else if (request === "update") {
      console.error("Update Board Error:", err.message);
    } else if (request === "delete") {
      console.error("Delete Board Tag Error:", err.message);
    } else {
      console.error("Board Error:", err.message);
    }
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board task
const addBoardTask = async (
  session,
  id,
  organization_id,
  body,
  files,
  user = null
) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const { error, value } = addTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    if (board.tags.indexOf(value.tag) === -1) {
      return { isSuccess: false, message: "Tag not found", code: 404 };
    }
    const response = await taskservice.createTask(session, value, user, files);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    if (!board.tasks) {
      board.tasks = [];
    }
    board.tasks.push(response.task_id);
    const updatedBoard = await board.save({ session });
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Add Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board task
const updateBoardTask = async (
  session,
  board_id,
  task_id,
  organization_id,
  body,
  user = null
) => {
  try {
    if (!board_id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    if (body.tag && board.tags.indexOf(body.tag) === -1) {
      return { isSuccess: false, message: "Tag not found", code: 404 };
    }
    const response = await taskservice.updateTask(session, task_id, body);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }

    return { data: response.data, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board task Attachment
const updateBoardTaskAttachment = async (
  session,
  board_id,
  task_id,
  organization_id,
  body,
  files,
  user
) => {
  try {
    if (!board_id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await taskservice.updateTaskAttachment(
      session,
      task_id,
      body,
      user,
      files
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    return { board: response.data, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Attachment Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board task Submission
const updateBoardTaskSubmission = async (
  session,
  board_id,
  task_id,
  organization_id,
  body,
  user,
  isProjectManager
) => {
  try {
    if (!board_id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    const response = await taskservice.updateTaskSubmission(
      session,
      task_id,
      body,
      user,
      isProjectManager
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    return { data: response.data, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Submission Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a board task Finish
const updateBoardTaskFinish = async (
  session,
  board_id,
  task_id,
  organization_id,
  body
) => {
  try {
    if (!board_id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    const response = await taskservice.updateTaskFinish(session, task_id, body);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    return { data: response.data, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Finish Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete a board task
const deleteBoardTask = async (
  session,
  board_id,
  task_id,
  organization_id,
  user = null
) => {
  try {
    if (!board_id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await taskservice.deleteTask(session, task_id);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const taskIndex = board.tasks.indexOf(task_id);
    board.tasks.splice(taskIndex, 1);
    await board.save({ session });
    return { isSuccess: true, message: "Task deleted successfully" };
  } catch (err) {
    console.error("Delete Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete a board
const deleteBoard = async (session, id, organization_id, user = null) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID", code: 400 };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (user && !user.board_ids?.includes(id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    await Board.findByIdAndDelete(id, { session });
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Board Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get All Tasks of a Board
const getAllBoardTasks = async (board_id, req_query, user = null) => {
  try {
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const {
      page = 1,
      limit = 10,
      tag,
    } = req_query;

    const pageNumber = Number.isInteger(parseInt(page, 10))
      ? parseInt(page, 10)
      : 1;
    const limitNumber = Number.isInteger(parseInt(limit, 10))
      ? parseInt(limit, 10)
      : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const query = { _id: new mongoose.Types.ObjectId(board_id) };

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "tasks",
          localField: "tasks",
          foreignField: "_id",
          as: "tasks",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "assignee_to",
                foreignField: "_id",
                as: "assignee_to",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "created_by",
                foreignField: "_id",
                as: "created_by",
              },
            },
            {
              $unwind: {
                path: "$created_by",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                tag: 1,
                title: 1,
                description: 1,
                due_date: 1,
                assignee_to: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  avatar: 1,
                },
                attachments: 1,
                created_by: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  avatar: 1,
                },
                priority: 1,
                created_at: 1,
                updated_at: 1,
                is_submitted: 1,
                is_finished: 1,
                rank: 1,
              },
            },
          ],
        },
      },
      {
        $facet: {
          totalDataCount: [{ $unwind: "$tasks" }, { $count: "total" }],
          totalTagDataCount: [
            { $unwind: "$tasks" },
            ...(tag ? [{ $match: { "tasks.tag": tag } }] : []),
            { $count: "total" },
          ],
          tasks: [
            { $unwind: "$tasks" },
            ...(tag ? [{ $match: { "tasks.tag": tag } }] : []),
            { $sort: { "tasks.rank": 1 } },
            { $skip: skip },
            { $limit: limitNumber },
            {
              $project: {
                _id: 0,
                id: "$tasks._id",
                tag: "$tasks.tag",
                title: "$tasks.title",
                description: "$tasks.description",
                due_date: "$tasks.due_date",
                assignee_to: "$tasks.assignee_to",
                attachments: "$tasks.attachments",
                created_by: "$tasks.created_by",
                priority: "$tasks.priority",
                created_at: "$tasks.created_at",
                updated_at: "$tasks.updated_at",
                is_submitted: "$tasks.is_submitted",
                is_finished: "$tasks.is_finished",
                rank: "$tasks.rank",
              },
            },
          ],
        },
      },
      {
        $project: {
          totalTasks: { $arrayElemAt: ["$totalDataCount.total", 0] },
          totalTagTasks: { $arrayElemAt: ["$totalTagDataCount.total", 0] },
          tasks: "$tasks",
        },
      },
    ];

    const result = await Board.aggregate(pipeline);

    if (!result.length) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }

    const { tasks, totalTasks = 0, totalTagTasks = 0 } = result[0];
    const totalPages = Math.ceil(totalTasks / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    const pagination = {
      totalItems: totalTasks,
      totalTagItems: totalTagTasks,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    };

    return {
      data: tasks,
      pagination,
      isSuccess: true,
    };
  } catch (err) {
    console.error("Get Board Tasks Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get Board Task by ID
const getBoardTaskById = async (board_id, task_id, user = null) => {
  try {
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const board = await Board.findOne({ _id: board_id });
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    if (!board.tasks.includes(task_id)) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    const task = await taskservice.getTaskById(task_id);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    return { data: task.data, isSuccess: true };
  } catch (err) {
    console.error("Get Board Task By ID Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get All Tags of a Board
const getBoardTags = async (board_id, user = null) => {
  try {
    if (user && !user?.board_ids?.includes(board_id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const board = await Board.findOne({ _id: board_id });
    if (!board) {
      return { isSuccess: false, message: "Board not found", code: 404 };
    }
    return { tags: board.tags, isSuccess: true };
  } catch (err) {
    console.error("Get Board Tags Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

module.exports = {
  createBoard,
  updateBoard,
  getBoardById,
  updateBoardTag,
  addBoardTask,
  updateBoardTask,
  updateBoardTaskAttachment,
  updateBoardTaskSubmission,
  updateBoardTaskFinish,
  deleteBoardTask,
  deleteBoard,
  getBoardTaskById,
  getAllBoardTasks,
  getBoardTags,
};
