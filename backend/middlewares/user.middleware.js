const { errorResponse } = require("../utils/response");
const jwt = require('jsonwebtoken');

module.exports = function isAdmin(req, res, next) {
    // Check if the token is present in the request header
    
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
        return errorResponse(res, 401, 'Unauthorized: No token provided');
    }

    // Verify the token
    const token = authorizationHeader.split(' ')[1];

    // decode the token
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    if (!decoded) {
      return errorResponse(res, 401, 'Unauthorized: Invalid token');
    }

    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return errorResponse(res, 403, 'Forbidden: Access denied for this resource');
    }
  };
  