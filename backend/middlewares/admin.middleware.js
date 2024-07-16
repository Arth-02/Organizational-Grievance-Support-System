const { errorResponse } = require("../utils/response");
const jwt = require("jsonwebtoken");

// Modify the middleware to accept roles
const checkRole = (allowedRoles) => async (req, res, next) => {
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    return errorResponse(res, 401, "Unauthorized: No token provided");
  }

  const token = authorizationHeader.split(" ")[1];
  const decoded = jwt.decode(token, process.env.JWT_SECRET);
  if (!decoded) {
    return errorResponse(res, 401, "Unauthorized: Invalid token");
  }
  req.user = decoded.user;

  // Check if the decoded token role is in the allowedRoles array
  if (req.user && allowedRoles.includes(req.user.role)) {
    next();
  } else {
    return errorResponse(res,403,"Forbidden: Access denied for this resource");
  }
};

module.exports = { checkRole };
