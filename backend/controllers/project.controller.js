const { default: mongoose } = require("mongoose");
const Project = require("../models/project.model");
const {
  catchResponse,
  successResponse,
  errorResponse,
} = require("../utils/response");
const { createProjectSchema } = require("../validators/project.validator");
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
    const boardBody = { name: value.name };
    const response = await boardService.createBoard(
      session,
      organization_id,
      boardBody
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, "Error creating project board");
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
    const response = await projectService.updateProject(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.project,
      "Project updated successfully"
    );
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProjectBoardTag(
      session,
      req.params.id,
      req.body,
      req.user,
      "add"
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Project board updated successfully"
    );
  } catch (err) {
    console.error("Add Project Board Tag Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update a project Board Tag
const updateProjectBoardTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProjectBoardTag(
      session,
      req.params.id,
      req.body,
      req.user,
      "update"
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Project board updated successfully"
    );
  } catch (err) {
    console.error("Update Project Board Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// delete a project Board Tag
const deleteProjectBoardTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProjectBoardTag(
      session,
      req.params.id,
      req.body,
      req.user,
      "delete"
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Project board updated successfully"
    );
  } catch (err) {
    console.error("Delete Project Board Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

const addProjectBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.addProjectBoardTask(
      session,
      req.params.id,
      req.body,
      req.user,
      req.files
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Added task to project board successfully"
    );
  } catch (err) {
    console.error("Add Project Board Task Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update a project Board Task
const updateProjectBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProjectBoardTask(
      session,
      req.params.project_id,
      req.params.task_id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Updated task in project board successfully"
    );
  } catch (err) {
    console.error("Update Project Board Task Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update a project Board Task Attachment
const updateProjectBoardTaskAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.updateProjectBoardTaskAttachment(
      session,
      req.params.project_id,
      req.params.task_id,
      req.body,
      req.files,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Updated task attachment in project board successfully"
    );
  } catch (err) {
    console.error("Update Project Board Task Attachment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// delete a project Board Task
const deleteProjectBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await projectService.deleteProjectBoardTask(
      session,
      req.params.project_id,
      req.params.task_id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.board,
      "Deleted task from project board successfully"
    );
  } catch (err) {
    console.error("Delete Project Board Task Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get by id
const getProjectById = async (req, res) => {
  try {
    const response = await projectService.getProjectById(
      req.params.id,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      response.project,
      "Project fetched successfully"
    );
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
    const response = await projectService.deleteProject(
      session,
      req.params.id,
      req.user.organization_id
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
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
        .skip(skip),
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
  addProjectBoardTask,
  updateProjectBoardTask,
  updateProjectBoardTaskAttachment,
  deleteProjectBoardTask,
  getProjectById,
  deleteProject,
  getAllProjects,
};
