const User = require("../models/user.model");
const { DEV } = require("../utils/constant");
const { errorResponse, catchResponse } = require("../utils/response");
const jwt = require("jsonwebtoken");

// Check User role has permission to access the resource
const checkRole = (allowedRoles) => async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      return errorResponse(res, 401, "Unauthorized: No token provided");
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    if (!decoded) {
      return errorResponse(res, 401, "Unauthorized: Invalid token");
    }

    const id = decoded.user.id;
    const user = await User.findById(id).populate("role");
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    req.user = user;

    // Check if the decoded token role is in the allowedRoles array
    if (( req.user && allowedRoles.includes(req.user.role.name)) || req.user.role.name === DEV ) {
      next();
    } else {
      return errorResponse( res, 403, "Forbidden: Access denied for this resource" );
    }
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// Check User role has permission or user has special permission to access the resource
const checkPermission = (allowedPermissions) => async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      return errorResponse(res, 401, "Unauthorized: No token provided");
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    if (!decoded) {
      return errorResponse(res, 401, "Unauthorized: Invalid token");
    }

    const id = decoded.user.id;
    const user = await User.findById(id).populate("role");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    req.user = user;

    const hasUserRolePermissions = req.user?.role?.permissions?.some(
      (permission) => allowedPermissions.includes(permission)
    );
    const hasSpecialPermissions = req.user?.special_permissions?.some(
      (permission) => allowedPermissions.includes(permission)
    );
    const hasUserPermission = hasUserRolePermissions || hasSpecialPermissions;
    // Check if the decoded token role is in the allowedRoles array
    if (req.user.role.name === DEV || hasUserPermission) {
      next();
    } else {
      return errorResponse( res, 403, "Forbidden: Access denied for this resource" );
    }
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// Check user is logged in
const isLoggedIn = async (req, res, next) => {
  try {
    console.log("Request Headers:", req.headers);
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      return errorResponse(res, 401, "Unauthorized: No token provided");
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    if (!decoded) {
      return errorResponse(res, 401, "Unauthorized: Invalid token");
    }

    const id = decoded.user.id;
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    req.user = user;
    console.log("User:", req.user);

    next();
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};


module.exports = { checkRole, checkPermission, isLoggedIn };
