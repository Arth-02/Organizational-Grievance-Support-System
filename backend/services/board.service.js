const mongoose = require("mongoose");
const Board = require("../models/board.model");
const {
  updateBoardTagSchema,
  addAndDeleteBoardTagSchema,
  createBoardSchema,
  updateBoardSchema,
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

// Update a board
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
  updateBoardTag,
  deleteBoard,
};
