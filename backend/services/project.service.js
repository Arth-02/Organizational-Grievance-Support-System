const mongoose = require("mongoose");
const boardService = require("./board.service");
const Project = require("../models/project.model");
const { updateProjectSchema } = require("../validators/project.validator");
const { UPDATE_PROJECT, VIEW_PROJECT } = require("../utils/constant");
const { isValidObjectId } = mongoose;

// Update a project
const updateProject = async (session, id, body, user) => {
  try {
    const { _id: userId, organization_id, role, special_permissions } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const { error, value } = updateProjectSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }

    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    const permissions = [...role.permissions, ...special_permissions];
    canUpdate =
      project.manager?.toString() === userId.toString() ||
      permissions.includes(UPDATE_PROJECT.slug);
    if (!canUpdate) {
      return { isSuccess: false, message: "Permission denied" };
    }
    if (value.name) {
      const boardResponse = await boardService.updateBoard(
        session,
        project.board_id,
        organization_id,
        { name: value.name }
      );
      if (!boardResponse.isSuccess) {
        return { isSuccess: false, message: boardResponse.message };
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
    return { isSuccess: false, message: err.message };
  }
};

// Add, Update and Delete a project board tag
const updateProjectBoardTag = async (session, id, body, user, request) => {
  try {
    const { organization_id, _id: userId } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    if (!project.members.includes(userId)) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const response = await boardService.updateBoardTag(
      session,
      project.board_id,
      organization_id,
      body,
      request
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message };
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
    return { isSuccess: false, message: err.message };
  }
};

// Add a project board task
const addProjectBoardTask = async (session, id, body, user,files) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    if (!project.members.includes(userId)) {
      return { isSuccess: false, message: "Permission denied" };
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
      return { isSuccess: false, message: response.message };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Add Project Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Update a project board task
const updateProjectBoardTask = async (session, project_id, task_id, body, user) => {
  try{
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({ _id: project_id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    if (!project.members.includes(userId)) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const response = await boardService.updateBoardTask(
      session,
      project.board_id,
      task_id,
      organization_id,
      body,
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Update Project Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Delete a project board task
const deleteProjectBoardTask = async (session, project_id, task_id, user) => {
  try{
    if (!project_id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(project_id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const { organization_id, _id: userId } = user;
    const project = await Project.findOne({ _id: project_id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    if (!project.members.includes(userId)) {
      return { isSuccess: false, message: "Permission denied" };
    }
    const response = await boardService.deleteBoardTask(
      session,
      project.board_id,
      task_id,
      organization_id,
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message };
    }
    const board = response.board;
    return { board, isSuccess: true };
  } catch (err) {
    console.error("Delete Project Board Task Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Get a project by ID
const getProjectById = async (id, user) => {
  try {
    const { organization_id, role, special_permissions, _id } = user;
    if (!id) {
      return { isSuccess: false, message: "Project ID is required" };
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
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    const isProjectMember = project.members.includes(_id);
    if (!hasPermission && !isProjectMember) {
      return { isSuccess: false, message: "Permission denied" };
    }
    return { project, isSuccess: true };
  } catch (err) {
    console.error("Get Project Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

// Delete a project
const deleteProject = async (session, id, organization_id) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Project ID is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Project id" };
    }
    const project = await Project.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!project) {
      return { isSuccess: false, message: "Project not found" };
    }
    const boardResponse = await boardService.deleteBoard(
      session,
      project.board_id,
      organization_id
    );
    if (!boardResponse.isSuccess) {
      return { isSuccess: false, message: boardResponse.message };
    }
    await Project.findByIdAndDelete(id).session(session);
    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    return { isSuccess: false, message: err.message };
  }
};

module.exports = {
  updateProjectBoardTag,
  updateProject,
  addProjectBoardTask,
  updateProjectBoardTask,
  deleteProjectBoardTask,
  getProjectById,
  deleteProject,
};
