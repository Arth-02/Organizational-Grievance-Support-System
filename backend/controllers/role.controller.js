const Role = require("../models/role.model");
const { DEFAULT_PERMISSIONS } = require("../utils/constant");
const { errorResponse, successResponse } = require("../utils/response");

// cmd function to reset all permissons for each role
const resetPermissions = async (req, res) => {
  try {
    console.log("Resetting permissions");
    for (let i = 0; i < DEFAULT_PERMISSIONS.length; i++) {
      const newRole = {
        name: DEFAULT_PERMISSIONS[i].name,
        permission_id: DEFAULT_PERMISSIONS[i].permission_id,
      };
      await Role.findOneAndUpdate(
        { name: DEFAULT_PERMISSIONS[i].name },
        newRole,
        { upsert: true }
      );
    }
    return successResponse(res, 200, "Permissions reset successfully");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

// Export the function
module.exports = { resetPermissions };
