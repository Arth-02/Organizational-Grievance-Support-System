const mongoose = require("mongoose");
const Board = require("../models/board.model");
const attachmentService = require("./attachment.service");
const {
  updateBoardTagSchema,
  addAndDeleteBoardTagSchema,
  createBoardSchema,
  updateBoardSchema,
  addBoardTaskSchema,
  updateBoardTaskSchema,
  updateBoardTaskAttachmentchema,
} = require("../validators/board.validator");
const { isValidObjectId } = mongoose;

// Create a new board
const createBoard = async (session, organization_id, body) => {
  try {
    const { error, value } = createBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    const { name } = value;
    const newBoard = new Board({ organization_id, name });
    const board = await newBoard.save({ session });
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Create Board Error:", err.message);
    return { isSuccess: false };
  }
};

// Update a board
const updateBoard = async (session, id, organization_id, body, user = null) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    const { error, value } = updateBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, session }
    );
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Update Board Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Get a board by ID
const getBoardById = async (id, organization_id) => {
  try{
    if (!id) {
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    const board = await Board.findOne({ _id: id, organization_id });
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Get Board By ID Error:", err.message);
    return { isSuccess: false, message: err.message };
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
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
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
      return { isSuccess: false, message: errors };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    if (request === "add") {
      const { tag } = value;
      if (board.tags.includes(tag)) {
        return { isSuccess: false, message: "Tag already exists" };
      }
      board.tags.push(tag);
    } else if (request === "update") {
      const { oldtag, newtag } = body;
      const tagIndex = board.tags.indexOf(oldtag);
      if (tagIndex === -1) {
        return { isSuccess: false, message: "old Tag not found" };
      }
      if (board.tags.includes(newtag)) {
        return { isSuccess: false, message: "new Tag already exists" };
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
        return { isSuccess: false, message: "Tag not found" };
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
    return { isSuccess: false, message: err.message };
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
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    const { error, value } = addBoardTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    if (board.tags.indexOf(value.tag) === -1) {
      return { isSuccess: false, message: "Tag not found" };
    }
    let response;
    if (files && files.length > 0) {
      response = await attachmentService.createAttachment(
        session,
        user._id,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      const attachmentIds = response.attachmentIds;
      value.attachments = attachmentIds;
    }
    const newTask = { ...value };
    board.tasks.push(newTask);
    const updatedBoard = await board.save({ session });
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Add Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
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
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    if (!task_id) {
      return { isSuccess: false, message: "Task ID is required" };
    }
    if (!isValidObjectId(task_id)) {
      return { isSuccess: false, message: "Invalid Task ID" };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && board_id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    console.log(task_id);
    console.log("board.tasks", board.tasks);
    const taskIndex = board.tasks.findIndex(
      (task) => task._id.toString() === task_id
    );
    if (taskIndex === -1) {
      return { isSuccess: false, message: "Task not found" };
    }
    const { error, value } = updateBoardTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    if (value.tag && board.tags.indexOf(value.tag) === -1) {
      return { isSuccess: false, message: "Tag not found" };
    }
    const task = board.tasks[taskIndex];
    task.tag = value.tag || task.tag;
    task.title = value.title || task.title;
    task.description = value.description || task.description;
    task.due_date = value.due_date || task.due_date;
    task.assignee_to = value.assignee_to || task.assignee_to;
    task.priority = value.priority || task.priority;
    const updatedBoard = await board.save({ session });
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
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
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    if (!task_id) {
      return { isSuccess: false, message: "Task ID is required" };
    }
    if (!isValidObjectId(task_id)) {
      return { isSuccess: false, message: "Invalid Task ID" };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && board_id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const taskIndex = board.tasks.findIndex(
      (task) => task._id.toString() === task_id
    );
    if (taskIndex === -1) {
      return { isSuccess: false, message: "Task not found" };
    }
    const task = board.tasks[taskIndex];
    const { error, value } = updateBoardTaskAttachmentchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    let totalAttachments = task.attachments.length;
    if (files && files.length > 0) {
      totalAttachments += files.length;
    }
    if (value.delete_attachments && value.delete_attachments.length > 0) {
      totalAttachments -= value.delete_attachments.length;
    }
    if (totalAttachments > 5) {
      return { isSuccess: false, message: "Maximum 5 attachments allowed" };
    }
    if (value.delete_attachments && value.delete_attachments.length > 0) {
      const deleteAttachments = value.delete_attachments;
      const response = await attachmentService.deleteAttachment(
        session,
        deleteAttachments
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      task.attachments = task.attachments.filter(
        (attachment) => !deleteAttachments.includes(attachment.toString())
      );
    }
    let response;
    if (files && files.length > 0) {
      response = await attachmentService.createAttachment(
        session,
        user._id,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      const attachmentIds = response.attachmentIds;
      task.attachments = task.attachments.concat(attachmentIds);
    }
    const updatedBoard = await board.save({ session });
    return { board: updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Update Board Task Attachment Error:", err.message);
    return { isSuccess: false, message: err.message };
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
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(board_id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    if (!task_id) {
      return { isSuccess: false, message: "Task ID is required" };
    }
    if (!isValidObjectId(task_id)) {
      return { isSuccess: false, message: "Invalid Task ID" };
    }
    const board = await Board.findOne({
      _id: board_id,
      organization_id,
    }).session(session);
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && board_id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const taskIndex = board.tasks.findIndex(
      (task) => task._id.toString() === task_id
    );
    if (taskIndex === -1) {
      return { isSuccess: false, message: "Task not found" };
    }
    board.tasks.splice(taskIndex, 1);
    const updatedBoard = await board.save({ session });
    return { updatedBoard, isSuccess: true };
  } catch (err) {
    console.error("Delete Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Delete a board
const deleteBoard = async (session, id, organization_id, user = null) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Board ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Board ID" };
    }
    const board = await Board.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!board) {
      return { isSuccess: false, message: "Board not found" };
    }
    if (user && id === user.board_id) {
      return { isSuccess: false, message: "Permission denied" };
    }
    await Board.findByIdAndDelete(id, { session });
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Board Error:", err.message);
    return { isSuccess: false, message: err.message };
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
