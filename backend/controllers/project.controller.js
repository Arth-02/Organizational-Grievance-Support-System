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
const boardService = require("../services/board.service");
const { ObjectId } = mongoose.Types;
const projectService = require("../services/project.service");

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

    const response = await boardService.createBoard(organization_id);
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, 500, "Error creating project board");
    }
    const board = response.board;
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

// Add a Project Board Tag
const addProjectBoardTag = async (req, res) => {
  try{
    const response = await projectService.updateProjectBoardTag(req.params.id, req.body, req.user,"add");
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(res, response.board, "Project board updated successfully");
  } catch (err) {
    console.error("Add Project Board Tag Error:", err.message);
    return catchResponse(res);
  }
};

// update a project Board Tag
const updateProjectBoardTag = async (req, res) => {
  try{
    const response = await projectService.updateProjectBoardTag(req.params.id, req.body, req.user,"update");
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(res, response.board, "Project board updated successfully");
  } catch (err) {
    console.error("Update Project Board Error:", err.message);
    return catchResponse(res);
  }
};

// delete a project Board Tag
const deleteProjectBoardTag = async (req, res) => {
  try{
    const response = await projectService.updateProjectBoardTag(req.params.id, req.body, req.user,"delete");
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(res, response.board, "Project board updated successfully");
  } catch (err) {
    console.error("Delete Project Board Error:", err.message);
    return catchResponse(res);
  }
};

// get by id
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, role, special_permissions, _id } = req.user;
    if (!id) {
      return errorResponse(res, 400, "Project ID is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid Project id");
    }
    const permissions = [...role.permissions, ...special_permissions];
    const hasPermission = permissions.includes(VIEW_PROJECT.slug);
    const project = await Project.findOne({
      _id: id,
      organization_id,
    }).populate("board_id");
    const isProjectMember = project.members.includes(_id);
    if (!hasPermission && !isProjectMember) {
      return errorResponse(res, 403, "Permission denied");
    }
    if (!project) {
      return errorResponse(res, 404, "Project not found");
    }
    return successResponse(res, project, "Project fetched successfully");
  } catch (err) {
    console.error("Get Project Error:", err.message);
    return catchResponse(res);
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    if (!id) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Project ID is required");
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Invalid Project id");
    }
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      await session.abortTransaction();
      return errorResponse(res, 404, "Project not found");
    }
    const deleteBoard = await Board.findByIdAndDelete(project.board_id).session(
      session
    );
    const deletedProject = await Project.findByIdAndDelete(id).session(session);
    if (!deletedProject) {
      return errorResponse(res, 404, "Project not found");
    }
    await session.commitTransaction();
    return successResponse(res, null, "Project deleted successfully");
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get all projects
const getAllProjects = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const {
      page = 1,
      limit = 10,
      name,
      manager,
      members,
      is_active = "true",
      sort_by = "created_at",
      order = "desc",
    } = req.query;

    const pageNumber = Number.isInteger(parseInt(page, 10))
      ? parseInt(page, 10)
      : 1;
    const limitNumber = Number.isInteger(parseInt(limit, 10))
      ? parseInt(limit, 10)
      : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const query = {};

    if (is_active === "true" || is_active === "false") {
      query.is_active = is_active === "true";
    }
    if (organization_id) {
      query.organization_id = organization_id;
    }
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (manager) {
      query.manager = new ObjectId(manager);
    }
    if (members) {
      const membersArray = members
        .split(",")
        .map((member) => new ObjectId(member.trim()));
      query.members = { $in: membersArray };
    }
    const [projects, totalProjects] = await Promise.all([
      Project.find(query)
        .sort({ [sort_by]: order })
        .limit(limitNumber)
        .skip(skip)
        .populate("board_id"),
      Project.countDocuments(query),
    ]);
    if (!projects) {
      return errorResponse(res, 404, "Projects not found");
    }
    const totalPages = Math.ceil(totalProjects / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      totalItems: totalProjects,
      totalPages: totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
    };
    return successResponse(
      res,
      {
        projects,
        pagination,
      },
      "Projects fetched successfully"
    );
  } catch (err) {
    console.error("Get Projects Error:", err.message);
    return catchResponse(res);
  }
};

module.exports = {
  createProject,
  updateProject,
  addProjectBoardTag,
  updateProjectBoardTag,
  deleteProjectBoardTag,
  getProjectById,
  deleteProject,
  getAllProjects,
};
