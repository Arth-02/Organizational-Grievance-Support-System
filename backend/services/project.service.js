const { isValidObjectId } = require("mongoose");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");

/**
 * Create a new project
 * @param {Object} session - MongoDB session for transaction
 * @param {Object} body - Project data
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, project?, message?, code? }
 */
const createProject = async (session, body, user) => {
  try {
    const { error, value } = createProjectSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { organization_id, _id: userId } = user;

    // Normalize key to uppercase and trimmed (already done by Joi, but ensure)
    const normalizedKey = value.key.toUpperCase().trim();

    // Check if project key already exists in the organization
    const existingProject = await Project.findOne({
      organization_id,
      key: normalizedKey,
      deleted_at: null,
    }).session(session);

    if (existingProject) {
      return {
        isSuccess: false,
        message: "Project key already exists in this organization",
        code: 400,
      };
    }

    // Validate managers belong to the same organization
    if (value.manager && value.manager.length > 0) {
      const validManagers = await User.find({
        _id: { $in: value.manager },
        organization_id,
        is_active: true,
      }).session(session);

      if (validManagers.length !== value.manager.length) {
        return {
          isSuccess: false,
          message: "One or more managers do not belong to this organization",
          code: 400,
        };
      }
    }

    // Validate members belong to the same organization
    if (value.members && value.members.length > 0) {
      const validMembers = await User.find({
        _id: { $in: value.members },
        organization_id,
        is_active: true,
      }).session(session);

      if (validMembers.length !== value.members.length) {
        return {
          isSuccess: false,
          message: "One or more members do not belong to this organization",
          code: 400,
        };
      }
    }

    const newProject = new Project({
      ...value,
      key: normalizedKey,
      organization_id,
      created_by: userId,
    });

    await newProject.save({ session });

    return { isSuccess: true, project: newProject };
  } catch (err) {
    console.error("Error in createProject service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Get project by ID
 * @param {String} id - Project ID
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, message?, code? }
 */
const getProjectById = async (id, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { organization_id } = user;

    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    })
      .populate({ path: "manager", select: "username email firstname lastname avatar" })
      .populate({ path: "members", select: "username email firstname lastname avatar" })
      .populate({ path: "created_by", select: "username email firstname lastname" });

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    return { isSuccess: true, data: project };
  } catch (err) {
    console.error("Error in getProjectById service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Get all projects with pagination
 * @param {Object} query - Query parameters
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, pagination?, message?, code? }
 */
const getAllProjects = async (query, user) => {
  try {
    const { organization_id } = user;
    const {
      page = 1,
      limit = 10,
      sort_by = "created_at",
      order = "desc",
      search,
      status,
      project_type,
    } = query;

    const pageNumber = Number.isInteger(parseInt(page, 10))
      ? parseInt(page, 10)
      : 1;
    const limitNumber = Number.isInteger(parseInt(limit, 10))
      ? parseInt(limit, 10)
      : 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build query - always filter by organization and exclude deleted
    const dbQuery = {
      organization_id,
      deleted_at: null,
    };

    // Apply filters
    if (status) {
      dbQuery.status = status;
    }

    if (project_type) {
      dbQuery.project_type = project_type;
    }

    if (search) {
      dbQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = { [sort_by]: sortOrder };

    const [projects, totalProjects] = await Promise.all([
      Project.find(dbQuery)
        .sort(sortObj)
        .limit(limitNumber)
        .skip(skip)
        .populate({ path: "manager", select: "username email firstname lastname avatar" })
        .populate({ path: "members", select: "username email firstname lastname avatar" })
        .populate({ path: "created_by", select: "username email firstname lastname" }),
      Project.countDocuments(dbQuery),
    ]);

    if (!projects.length) {
      return { isSuccess: false, message: "No projects found", code: 404 };
    }

    const totalPages = Math.ceil(totalProjects / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    const pagination = {
      totalItems: totalProjects,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    };

    return { isSuccess: true, data: projects, pagination };
  } catch (err) {
    console.error("Error in getAllProjects service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Update a project
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Project ID
 * @param {Object} body - Update data
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, message?, code? }
 */
const updateProject = async (session, id, body, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { error, value } = updateProjectSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { organization_id } = user;

    // Find the project first
    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Apply updates
    await Project.updateOne(
      { _id: id, organization_id },
      value,
      { new: true }
    ).session(session);

    // Fetch updated project with populated refs
    const updatedProject = await Project.findOne({
      _id: id,
      organization_id,
    })
      .populate({ path: "manager", select: "username email firstname lastname avatar" })
      .populate({ path: "members", select: "username email firstname lastname avatar" })
      .populate({ path: "created_by", select: "username email firstname lastname" })
      .session(session);

    return { isSuccess: true, data: updatedProject };
  } catch (err) {
    console.error("Error in updateProject service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Soft delete a project
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Project ID
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, message?, code? }
 */
const deleteProject = async (session, id, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { organization_id } = user;

    // Find the project first
    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Soft delete by setting deleted_at timestamp
    await Project.updateOne(
      { _id: id, organization_id },
      { deleted_at: new Date() }
    ).session(session);

    return { isSuccess: true, message: "Project deleted successfully" };
  } catch (err) {
    console.error("Error in deleteProject service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Get project members and managers
 * @param {String} id - Project ID
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, message?, code? }
 */
const getProjectMembers = async (id, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { organization_id } = user;

    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    })
      .populate({ path: "manager", select: "username email firstname lastname avatar" })
      .populate({ path: "members", select: "username email firstname lastname avatar" });

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Combine members and managers, removing duplicates
    const allMembers = [...(project.members || []), ...(project.manager || [])];
    const uniqueMembers = allMembers.filter((member, index, self) =>
      index === self.findIndex(m => m._id.toString() === member._id.toString())
    );

    return { isSuccess: true, data: uniqueMembers };
  } catch (err) {
    console.error("Error in getProjectMembers service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Add members/managers to a project
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Project ID
 * @param {Object} body - { members: [], manager: [] }
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, message?, code? }
 */
const addProjectMembers = async (session, id, body, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { organization_id } = user;
    const { members = [], manager = [] } = body;

    // Find the project first
    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Validate new members belong to the same organization
    if (members.length > 0) {
      const validMembers = await User.find({
        _id: { $in: members },
        organization_id,
        is_active: true,
      }).session(session);

      if (validMembers.length !== members.length) {
        return {
          isSuccess: false,
          message: "One or more members do not belong to this organization",
          code: 400,
        };
      }
    }

    // Validate new managers belong to the same organization
    if (manager.length > 0) {
      const validManagers = await User.find({
        _id: { $in: manager },
        organization_id,
        is_active: true,
      }).session(session);

      if (validManagers.length !== manager.length) {
        return {
          isSuccess: false,
          message: "One or more managers do not belong to this organization",
          code: 400,
        };
      }
    }

    // Add members and managers (using $addToSet to avoid duplicates)
    const updateObj = {};
    if (members.length > 0) {
      updateObj.$addToSet = { ...updateObj.$addToSet, members: { $each: members } };
    }
    if (manager.length > 0) {
      updateObj.$addToSet = { ...updateObj.$addToSet, manager: { $each: manager } };
    }

    if (Object.keys(updateObj).length > 0) {
      await Project.updateOne({ _id: id, organization_id }, updateObj).session(session);
    }

    // Fetch updated project with populated refs
    const updatedProject = await Project.findOne({
      _id: id,
      organization_id,
    })
      .populate({ path: "manager", select: "username email firstname lastname avatar" })
      .populate({ path: "members", select: "username email firstname lastname avatar" })
      .session(session);

    return { isSuccess: true, data: updatedProject };
  } catch (err) {
    console.error("Error in addProjectMembers service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

/**
 * Remove members/managers from a project
 * @param {Object} session - MongoDB session for transaction
 * @param {String} id - Project ID
 * @param {Object} body - { members: [], manager: [] }
 * @param {Object} user - Authenticated user
 * @returns {Object} - { isSuccess, data?, message?, code? }
 */
const removeProjectMembers = async (session, id, body, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Project ID is required",
        code: 400,
      };
    }

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const { organization_id } = user;
    const { members = [], manager = [] } = body;

    // Find the project first
    const project = await Project.findOne({
      _id: id,
      organization_id,
      deleted_at: null,
    }).session(session);

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Remove members and managers
    const updateObj = {};
    if (members.length > 0) {
      updateObj.$pull = { ...updateObj.$pull, members: { $in: members } };
    }
    if (manager.length > 0) {
      updateObj.$pull = { ...updateObj.$pull, manager: { $in: manager } };
    }

    if (Object.keys(updateObj).length > 0) {
      await Project.updateOne({ _id: id, organization_id }, updateObj).session(session);
    }

    // Fetch updated project with populated refs
    const updatedProject = await Project.findOne({
      _id: id,
      organization_id,
    })
      .populate({ path: "manager", select: "username email firstname lastname avatar" })
      .populate({ path: "members", select: "username email firstname lastname avatar" })
      .session(session);

    return { isSuccess: true, data: updatedProject };
  } catch (err) {
    console.error("Error in removeProjectMembers service:", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

module.exports = {
  createProject,
  getProjectById,
  getAllProjects,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMembers,
  removeProjectMembers,
};
