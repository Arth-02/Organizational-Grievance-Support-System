const mongoose = require("mongoose");
const Board = require("../models/board.model");
const attachmentService = require("./attachment.service");
const taskservice = require("./task.service");
const {
  updateBoardTagSchema,
  addAndDeleteBoardTagSchema,
  createBoardSchema,
  updateBoardSchema,
} = require("../validators/board.validator");
const { isValidObjectId } = mongoose;
const {
  addBoardTaskSchema,
  updateBoardTaskSchema,
  updateBoardTaskAttachmentchema,
} = require("../validators/task.validator");

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
    if (user && id === user.board_id) {
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
    if (user && id === user.board_id) {
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
        return { isSuccess: false, message: "old Tag not found", code: 400 };
      }
      if (board.tags.includes(newtag)) {
        return {
          isSuccess: false,
          message: "new Tag already exists",
          code: 400,
        };
      }
      board.tags[tagIndex] = newtag;
      for (let i = 0; i < board.tasks.length; i++) {
        if (board.tasks[i].tag === oldtag) {
          board.tasks[i].tag = newtag;
        }
      }
    } else if (request === "delete") {
      const { tag } = value;
      const tagIndex = board.tags.indexOf(tag);
      if (tagIndex === -1) {
        return { isSuccess: false, message: "Tag not found", code: 400 };
      }
      board.tags.splice(tagIndex, 1);
      for (let i = 0; i < board.tasks.length; i++) {
        if (board.tasks[i].tag === tag) {
          board.tasks.splice(i, 1);
          i--;
        }
      }
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
    const { error, value } = addBoardTaskSchema.validate(body, {
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
    if (user && id === user.board_id) {
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
    if (user && board_id === user.board_id) {
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
    if (user && board_id === user.board_id) {
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
    if (user && board_id === user.board_id) {
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
    if (user && id === user.board_id) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    await Board.findByIdAndDelete(id, { session });
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Board Error:", err.message);
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
  deleteBoardTask,
  deleteBoard,
};
