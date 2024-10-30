const mongoose = require("mongoose");
const Board = require("../models/board.model");
const { updateBoardSchema } = require("../validators/board.validator");
const { isValidObjectId } = mongoose;

// Create a new board
const createBoard = async (organization_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newBoard = new Board({ organization_id });
    const board = await newBoard.save({ session });
    await session.commitTransaction();
    return board;
  } catch (err) {
    console.error("Create Board Error:", err.message);
    await session.abortTransaction();
    throw new Error("Error creating board");
  } finally {
    session.endSession();
  }
};

// Update a board
const updateBoard = async (id, body, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id, _id: userId } = user;
    if (!id) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Board ID is required");
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Invalid Board ID");
    }
    const board = await Board.findOne({ _id: id, organization_id });
    if (!board) {
      return errorResponse(res, 404, "Board not found");
    }
    if (!board.users.includes(userId)) {
      return errorResponse(res, 403, "Unauthorized");
    }
    const { error, value } = updateBoardSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    await session.commitTransaction();
    return board;
  } catch (err) {
    console.error("Update Board Error:", err.message);
    await session.abortTransaction();
    throw new Error("Error updating board");
  } finally {
    session.endSession();
  }
};

module.exports = {
  createBoard,
};
