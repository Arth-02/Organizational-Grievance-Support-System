const mongoose = require("mongoose");
const boardService = require("./board.service");
const Project = require("../models/project.model");
const {
  updateProjectSchema,
  createProjectSchema,
} = require("../validators/project.validator");
const {
  UPDATE_PROJECT,
  VIEW_PROJECT,
  CREATE_PROJECT,
} = require("../utils/constant");
const User = require("../models/user.model");
const { isValidObjectId } = mongoose;

// Create a project service
const createProject = async (session, body, user) => {
  try {
    const { organization_id, role, special_permissions, _id } = user;
    const permissions = [...role.permissions, ...special_permissions];
    const canCreate = permissions.includes(CREATE_PROJECT.slug);
    if (!canCreate) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const { error, value } = createProjectSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    if (value.manager && value.manager.length > 0) {
      for (let i = 0; i < value.manager.length; i++) {
        if (!value.members.includes(value.manager[i])) {
          value.members.push(value.manager[i]);
        }
      }
    }
    if (value.members && value.members.length > 0) {
      const memberIds = value.members;
      const members = await User.find({
        _id: { $in: memberIds },
        organization_id: organization_id,
      });
      if (members.length !== memberIds.length) {
        return {
          isSuccess: false,
          message: "Some members not found",
          code: 404,
        };
      }
    }
    const boardBody = { name: value.name };
    const response = await boardService.createBoard(
      session,
      organization_id,
      boardBody
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message, code: 400 };
    }
    const board = response.board;
    const newProject = new Project({
      ...value,
      organization_id,
      board_id: board._id,
      created_by: user._id,
    });
    const project = await newProject.save({ session });

    return { data: project, isSuccess: true };
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a project
const updateProject = async (session, id, body, user) => {
  try {
    const { _id: userId, organization_id, role, special_permissions } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { error, value } = updateProjectSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    const permissions = [...role.permissions, ...special_permissions];
    canUpdate =
      project.created_by.toString() === userId.toString() ||
      project.manager.includes(userId) ||
      permissions.includes(UPDATE_PROJECT.slug);
    if (!canUpdate) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    if (value.name) {
      const boardResponse = await boardService.updateBoard(
        session,
        project.board_id,
        organization_id,
        { name: value.name }
      );
      if (!boardResponse.isSuccess) {
        return { isSuccess: false, message: boardResponse.message, code: 400 };
      }
    }
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, session }
    );

    return { project: updatedProject, isSuccess: true };
  } catch (err) {
    console.error("Update Project Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Add, Update and Delete a project board tag
const updateProjectBoardTag = async (session, id, body, user, request) => {
  try {
    const { organization_id, _id: userId } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (
      !project.manager.includes(userId) ||
      project.created_by.toString() === userId.toString()
    ) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.updateBoardTag(
      session,
      project.board_id,
      organization_id,
      body,
      request
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const board = response.updatedBoard;
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
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Add a project board task
const addProjectBoardTask = async (session, id, body, user, files) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (
      !project.manager.includes(userId) ||
      project.created_by.toString() === userId.toString()
    ) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.addBoardTask(
      session,
      project.board_id,
      organization_id,
      body,
      files,
      user
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Add Project Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a project board task
const updateProjectBoardTask = async (
  session,
  project_id,
  task_id,
  body,
  user
) => {
  try {
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    }).session(session);
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (
      !project.manager.includes(userId) ||
      project.created_by.toString() === userId.toString()
    ) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.updateBoardTask(
      session,
      project.board_id,
      task_id,
      organization_id,
      body
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
    console.error("Update Project Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a project board task attachment
const updateProjectBoardTaskAttachment = async (
  session,
  project_id,
  task_id,
  body,
  files,
  user
) => {
  try {
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    }).session(session);
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (
      !project.manager.includes(userId) ||
      project.created_by.toString() === userId.toString()
    ) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.updateBoardTaskAttachment(
      session,
      project.board_id,
      task_id,
      organization_id,
      body,
      files,
      user
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Update Project Board Task Attachment Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a project board task submission
const updateProjectBoardTaskSubmission = async (
  session,
  project_id,
  task_id,
  body,
  user
) => {
  try {
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id } = user;
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    }).session(session);
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    const isProjectMember = project.manager.includes(user._id);
    const response = await boardService.updateBoardTaskSubmission(
      session,
      project.board_id,
      task_id,
      organization_id,
      body,
      user,
      isProjectMember
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    return { isSuccess: true, data: response.data };
  } catch (err) {
    console.error("Update Project Board Task Submission Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a project board task finish
const updateProjectBoardTaskFinish = async (
  session,
  project_id,
  task_id,
  body,
  user
) => {
  try {
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id } = user;
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    }).session(session);
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (!project.manager.includes(user._id)) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.updateBoardTaskFinish(
      session,
      project.board_id,
      task_id,
      organization_id,
      body
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    return { isSuccess: true, data: response.data };
  } catch (err) {
    console.error("Update Project Board Task Finish Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete a project board task
const deleteProjectBoardTask = async (session, project_id, task_id, user) => {
  try {
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    }).session(session);
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    if (
      !project.manager.includes(userId) ||
      project.created_by.toString() === userId.toString()
    ) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    const response = await boardService.deleteBoardTask(
      session,
      project.board_id,
      task_id,
      organization_id
    );
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Delete Project Board Task Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get a project by ID
const getProjectById = async (id, user) => {
  try {
    const { organization_id, role, special_permissions, _id } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const permissions = [...role.permissions, ...special_permissions];
    const hasPermission = permissions.includes(VIEW_PROJECT.slug);
    const project = await Project.findOne({
      _id: id,
      organization_id,
    });
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    const isProjectMember =
      project.members.includes(_id) ||
      project.created_by.toString() === _id.toString();
    if (!hasPermission && !isProjectMember) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    return { project, isSuccess: true };
  } catch (err) {
    console.error("Get Project Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get All Project Board Tasks
const getAllProjectBoardTasks = async (project_id, user, req_query) => {
  try {
    const { organization_id, role, special_permissions, _id } = user;
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const permissions = [...role.permissions, ...special_permissions];
    const hasPermission = permissions.includes(VIEW_PROJECT.slug);
    const project = await Project.findOne({
      _id: project_id,
      organization_id,
    });
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    const isProjectMember =
      project.members.includes(_id) ||
      project.created_by.toString() === _id.toString();
    if (!hasPermission && !isProjectMember) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }
    return await boardService.getBoardTasks(project.board_id, req_query);
  } catch (err) {
    console.error("Get All Project Board Tasks Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete a project
const deleteProject = async (session, id, organization_id) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Project ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id", code: 400 };
    }
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }
    const boardResponse = await boardService.deleteBoard(
      session,
      project.board_id,
      organization_id
    );
    if (!boardResponse.isSuccess) {
      return { isSuccess: false, message: boardResponse.message, code: 400 };
    }
    await Project.findByIdAndDelete(id).session(session);
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

module.exports = {
  createProject,
  updateProjectBoardTag,
  updateProject,
  addProjectBoardTask,
  updateProjectBoardTask,
  updateProjectBoardTaskAttachment,
  updateProjectBoardTaskSubmission,
  updateProjectBoardTaskFinish,
  deleteProjectBoardTask,
  getProjectById,
  getAllProjectBoardTasks,
  deleteProject,
};
