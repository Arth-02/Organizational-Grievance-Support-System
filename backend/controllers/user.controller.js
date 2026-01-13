const { default: mongoose } = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const { PERMISSIONS } = require("../utils/constant");
const userService = require("../services/user.service");
const auditService = require("../services/audit.service");

// Login user
const login = async (req, res) => {
  try {
    const response = await userService.userLogin(req.body);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log user login audit
    await auditService.logLoginAction(
      {
        _id: response.data.id,
        username: response.data.username,
        firstname: response.data.role?.name || "",
        lastname: "",
        organization_id: response.data.organization_id?._id || response.data.organization_id,
      },
      req
    );
    
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
    
    // Log audit - user created by another user
    await auditService.logUserAction(
      "USER_CREATED",
      { _id: response.data.id, firstname: response.data.fullName || response.data.username, lastname: "" },
      req,
      { 
        createdBy: req.user._id,
        role: req.body.role,
        department: req.body.department
      }
    );
    
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
    // Get user data before update for comparison
    const targetUserId = req.params.id;
    const isUpdatingSelf = !targetUserId || targetUserId === req.user._id?.toString();
    
    let previousData = null;
    if (targetUserId && !isUpdatingSelf) {
      const prevResponse = await userService.getUserDetails(targetUserId, req.user);
      if (prevResponse.isSuccess) {
        previousData = prevResponse.data;
      }
    }
    
    const response = await userService.updateUserDetails(
      req.params.id,
      req.user,
      req.body,
      req.files
    );
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit if updating another user (not self)
    if (targetUserId && !isUpdatingSelf) {
      const changedFields = {};
      const trackFields = ["role", "department", "special_permissions", "is_active", "firstname", "lastname", "employee_id", "phone_number", "username"];
      
      // Helper to compare values (handles arrays and objects)
      const hasChanged = (oldVal, newVal) => {
        // If old value doesn't exist in previousData, skip comparison
        if (oldVal === undefined) return false;
        
        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          if (oldVal.length !== newVal.length) return true;
          const sortedOld = [...oldVal].sort();
          const sortedNew = [...newVal].sort();
          return sortedOld.some((v, i) => v !== sortedNew[i]);
        }
        // Convert ObjectId to string for comparison
        const oldStr = oldVal?.toString ? oldVal.toString() : oldVal;
        const newStr = newVal?.toString ? newVal.toString() : newVal;
        return oldStr !== newStr;
      };
      
      for (const field of trackFields) {
        if (req.body[field] !== undefined) {
          const oldValue = previousData?.[field];
          const newValue = req.body[field];
          
          // Only add to changedFields if value actually changed
          if (hasChanged(oldValue, newValue)) {
            changedFields[field] = {
              from: oldValue,
              to: newValue
            };
          }
        }
      }
      
      // Only log if there are actual changes
      if (Object.keys(changedFields).length > 0) {
        await auditService.logUserAction(
          "USER_UPDATED",
          response.data,
          req,
          { 
            updatedBy: req.user._id,
            changedFields
          }
        );
      }
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
    // Get user details before deletion for audit
    const userResponse = await userService.getUserDetails(req.params.id, req.user);
    
    const response = await userService.deleteUser(req.params.id, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (userResponse.isSuccess) {
      await auditService.logUserAction(
        "USER_DELETED",
        userResponse.data,
        req,
        { deletedBy: req.user._id }
      );
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
    // Get performer name for audit
    const performerName = await auditService.getPerformerName(req.user._id);
    
    const response = await userService.deleteMultipleUsers(req.body, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit for bulk delete
    await auditService.createAuditLog({
      action: "USER_DELETED",
      entity_type: "User",
      entity_name: `${req.body.ids?.length || 0} users`,
      description: `Bulk deleted ${req.body.ids?.length || 0} users by ${performerName}`,
      performed_by: req.user._id,
      organization_id: req.user.organization_id,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers["user-agent"],
      metadata: { 
        deletedUserIds: req.body.ids,
        deletedBy: req.user._id,
        performerName
      }
    });
    
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

// Change Password
const changePassword = async (req, res) => {
  try {
    const response = await userService.changePassword(req.body, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, response.message);
  } catch (err) {
    console.error("Change Password Error:", err.message);
    return catchResponse(res);
  }
};

// Change Email
const changeEmail = async (req, res) => {
  try {
    const response = await userService.changeEmail(req.body, req.user);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, {}, response.message);
  } catch (err) {
    console.error("Change Email Error:", err.message);
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
  changePassword,
  changeEmail,
};

