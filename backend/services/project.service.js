const mongoose = require("mongoose");
const boardService = require("./board.service");
const Project = require("../models/project.model");
const { isValidObjectId } = mongoose;

// Update a project board
const updateProjectBoardTag = async (id, body, user, request) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id, _id: userId } = user;
    if (!id) {
      await session.abortTransaction();
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const project = await Project.findOne({ _id: id, organization_id });
    if (!project) {
      await session.abortTransaction();
      return { isSuccess: false, message: "Project not found" };
    }
    if (!project.members.includes(userId)) {
      await session.abortTransaction();
      return { isSuccess: false, message: "Permission denied" };
    }
    const response = await boardService.updateBoardTag(
      project.board_id,
      organization_id,
      body,
      request
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return { isSuccess: false, message: response.message };
    }
    const board = response.updatedBoard;

    await session.commitTransaction();
    return { board, isSuccess: true };
  } catch (err) {
    if (request === "add") {
      console.error("Add Project Board Error:", err.message);
    } else if (request === "update") {
      console.error("Update Project Board Error:", err.message);
    } else if (request === "delete") {
      console.error("Delete Project Board Error:", err.message);
    } else {
      console.error("Project Board Error:", err.message);
    }
    await session.abortTransaction();
    return { isSuccess: false, message: err.message };
  } finally {
    session.endSession();
  }
};

module.exports = { updateProjectBoardTag };
