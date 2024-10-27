const { default: mongoose, isValidObjectId } = require("mongoose");
const Project = require("../models/project.model");
const Board = require("../models/board.model");
const {
  catchResponse,
  successResponse,
  errorResponse,
} = require("../utils/response");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");
const { VIEW_PROJECT } = require("../utils/constant");

// Create a new project

const createProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id } = req.user;
    const { error, value } = createProjectSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      await session.abortTransaction();
      return errorResponse(res, 400, errors);
    }

    const newBoard = new Board({ organization_id });
    const board = await newBoard.save({ session });

    const newProject = new Project({
      ...value,
      organization_id,
      board_id: board._id,
    });
    const project = await newProject.save({ session });

    await session.commitTransaction();
    return successResponse(res, project, "Project created successfully");
  } catch (err) {
    console.error("Get Users Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update a project
const updateProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (!id) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Project ID is required");
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Invalid Project id");
    }
    const { error, value } = updateProjectSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, session }
    );

    if (!updatedProject) {
      return errorResponse(res, 404, "Project not found");
    }
    await session.commitTransaction();
    return successResponse(res, updatedProject, "Project updated successfully");
  } catch (err) {
    console.error("Update Project Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

const getAllProjects = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const projects = await Project.find({ organization_id }).populate("board_id");
    return successResponse(res, projects, "Projects fetched successfully");
  } catch (err) {
    console.error("Get Projects Error:", err.message);
    return catchResponse(res);
  }
};

module.exports = { createProject, updateProject, getAllProjects };
