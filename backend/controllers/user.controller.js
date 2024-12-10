const { default: mongoose } = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const { PERMISSIONS } = require("../utils/constant");
const boardService = require("../services/board.service");
const userService = require("../services/user.service");

// Login user
const login = async (req, res) => {
  try {
    const response = await userService.userLogin(req.body);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Login successful");
  } catch (err) {
    console.error("Login Error:", err.message);
    return catchResponse(res);
  }
};

// Create new user
const createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await userService.createUser(
      session,
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
      response.data,
      "User created successfully",
      201
    );
  } catch (err) {
    console.error("Create User Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Get user profile
const getUser = async (req, res) => {
  try {
    const response = await userService.getUserDetails(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "User retrieved successfully");
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    return catchResponse(res);
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const response = await userService.updateUserDetails(
      req.params.id,
      req.user,
      req.body,
      req.files
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "User updated successfully");
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return catchResponse(res);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const response = await userService.deleteUser(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, "User deleted successfully");
  } catch (err) {
    console.error("Delete User Error:", err.message);
    return catchResponse(res);
  }
};

// Delete multiple users
const deleteAllUsers = async (req, res) => {
  try {
    const response = await userService.deleteMultipleUsers(req.body, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, "Users deleted successfully");
  } catch (err) {
    console.error("Delete All Users Error:", err.message);
    return catchResponse(res);
  }
};

// Create super admin
const createSuperAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await userService.createSuperAdmin(
      session,
      req.body,
      req.files
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Super Admin created successfully"
    );
  } catch (err) {
    console.error("Create Super Admin Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    await session.endSession();
  }
};

// Send OTP to email
const sendOTPEmail = async (req, res) => {
  try {
    const response = await userService.sendOTPEmail(req.body.organization_id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, "OTP sent successfully");
  } catch (err) {
    console.error("Generate OTP Error:", err.message);
    return catchResponse(res);
  }
};

// Check if username exists
const checkUsername = async (req, res) => {
  try {
    const response = await userService.checkUserField(
      req.body,
      req.user,
      "Username"
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    if (response.exists) {
      return successResponse(res, { exists: true }, "Username unavailable");
    } else {
      return successResponse(res, { exists: false }, "Username available");
    }
  } catch (err) {
    console.error("Check Username Error:", err.message);
    return catchResponse(res);
  }
};

// Check if email exists
const checkEmail = async (req, res) => {
  try {
    const response = await userService.checkUserField(
      req.body,
      req.user,
      "Email"
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    if (response.exists) {
      return successResponse(res, { exists: true }, "Email unavailable");
    }
    return successResponse(res, { exists: false }, "Email available");
  } catch (err) {
    console.error("Check Email Error:", err.message);
    return catchResponse(res);
  }
};

// Check if employee ID exists
const checkEmployeeID = async (req, res) => {
  try {
    const response = await userService.checkUserField(
      req.body,
      req.user,
      "Employee ID"
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    if (response.exists) {
      return successResponse(res, { exists: true }, "Employee ID unavailable");
    }
    return successResponse(res, { exists: false }, "Employee ID available");
  } catch (err) {
    console.error("Check Employee ID Error:", err.message);
    return catchResponse(res);
  }
};

// get all users
const getAllUsers = async (req, res) => {
  try {
    const response = await userService.getAllUsers(req.query, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }

    return successResponse(
      res,
      { users: response.data, pagination: response.pagination },
      "Users retrieved successfully"
    );
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return catchResponse(res);
  }
};

// get all permissions
const getAllPermissions = async (req, res) => {
  try {
    return successResponse(
      res,
      PERMISSIONS,
      "Permissions retrieved successfully"
    );
  } catch (err) {
    console.error("Get Permissions Error:", err.message);
    return catchResponse(res);
  }
};

// get all users id
const getAllUsersId = async (req, res) => {
  try {
    const response = await userService.getAllUsersId(req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Users retrieved successfully");
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return catchResponse(res);
  }
};

// Get User Name and Ids
const getUserNames = async (req, res) => {
  try {
    const response = await userService.getUserNamesAndIds(
      req.user.organization_id
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Users retrieved successfully");
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return catchResponse(res);
  }
};

// Add board
const addBoard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await userService.addBoardToUser(
      session,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Board created successfully");
  } catch (err) {
    console.error("Create Board Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// delete board
const deleteBoard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.deleteBoard(
      session,
      req.params.id,
      req.user.organization_id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, {}, "Board deleted successfully");
  } catch (err) {
    console.error("Delete Board Error:", err.message);
    return catchResponse(res);
  }
};

// add board tag
const addBoardTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id } = req.user;
    const { id } = req.params;
    const response = await boardService.updateBoardTag(
      session,
      id,
      organization_id,
      req.body,
      "add",
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.updatedBoard,
      "Board tag added successfully"
    );
  } catch (err) {
    console.error("Add Board Tag Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Get board by id
const getBoardById = async (req, res) => {
  try {
    const response = await boardService.getBoardById(
      req.params.id,
      req.user.organization_id
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.board, "Board retrieved successfully");
  } catch (err) {
    console.error("Get Board Error:", err.message);
    return catchResponse(res);
  }
};

// update board tag
const updateBoardTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id } = req.user;
    const { id } = req.params;
    const response = await boardService.updateBoardTag(
      session,
      id,
      organization_id,
      req.body,
      "update",
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.updatedBoard,
      "Board tag updated successfully"
    );
  } catch (err) {
    console.error("Update Board Tag Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// delete board tag
const deleteBoardTag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { organization_id } = req.user;
    const { id } = req.params;
    const response = await boardService.updateBoardTag(
      session,
      id,
      organization_id,
      req.body,
      "delete",
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.updatedBoard,
      "Board tag deleted successfully"
    );
  } catch (err) {
    console.error("Delete Board Tag Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// add board task
const addBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.addBoardTask(
      session,
      req.params.id,
      req.user.organization_id,
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
      response.updatedBoard,
      "Board task added successfully"
    );
  } catch (err) {
    console.error("Add Board Task Error:", err.message);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update a board task
const updateBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.updateBoardTask(
      session,
      req.params.board_id,
      req.params.task_id,
      req.user.organization_id,
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
      response.data,
      "Board task updated successfully"
    );
  } catch (err) {
    console.error("Update Board Task Error:", err.message);
    return catchResponse(res);
  }
};

// Update a board task Attachment
const updateBoardTaskAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.updateBoardTaskAttachment(
      session,
      req.params.board_id,
      req.params.task_id,
      req.user.organization_id,
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
      "Board task updated successfully"
    );
  } catch (err) {
    console.error("Update Board Task Error:", err.message);
    return catchResponse(res);
  }
};

// Delete a board task
const deleteBoardTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await boardService.deleteBoardTask(
      session,
      req.params.board_id,
      req.params.task_id,
      req.user.organization_id,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.updatedBoard,
      "Board task deleted successfully"
    );
  } catch (err) {
    console.error("Delete Board Task Error:", err.message);
    return catchResponse(res);
  }
};

// get User Borad Tasks
const getAllBoardTasks = async (req, res) => {
  try {
    const response = await boardService.getAllBoardTasks(
      req.params.id,
      req.query,
      req.user
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { tasks: response.data, pagination: response.pagination },
      "Board Tasks retrieved successfully"
    );
  } catch (err) {
    console.error("Get User Board Tasks Error:", err.message);
    return catchResponse(res);
  }
};

module.exports = {
  login,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  deleteAllUsers,
  createSuperAdmin,
  sendOTPEmail,
  checkUsername,
  checkEmail,
  checkEmployeeID,
  getAllUsers,
  getUserNames,
  getAllPermissions,
  getAllUsersId,
  addBoard,
  getBoardById,
  deleteBoard,
  addBoardTag,
  updateBoardTag,
  deleteBoardTag,
  addBoardTask,
  updateBoardTask,
  updateBoardTaskAttachment,
  deleteBoardTask,
  getAllBoardTasks,
};
