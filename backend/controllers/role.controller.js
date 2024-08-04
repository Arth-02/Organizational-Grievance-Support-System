const Joi = require("joi");
const Role = require("../models/role.model");
const { DEFAULT_PERMISSIONS } = require("../utils/constant");
const { errorResponse, successResponse, catchResponse } = require("../utils/response");
const { isValidObjectId } = require("mongoose");

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
    return catchResponse(res);
  }
};

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permission_id: Joi.array().items(Joi.number()).required(),
  organization_id: Joi.string().trim().required()
});

const createRole = async (req, res) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const { name, permission_id, organization_id } = value;
    const role = new Role({
      name,
      permission_id,
      organization_id
    });
    await role.save();
    return successResponse(res, 201, "Role created successfully", role);
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

const updateRole = async (req, res) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const { name, permission_id, organization_id } = value;
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id },
      { name, permission_id, organization_id },
      { new: true }
    );
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res, 200, "Role updated successfully", role);
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
}

// Delete role schema
const deleteRoleSchema = Joi.object({
  id: Joi.string().trim().required(),
  replace_role_id: Joi.string().trim()
});

const deleteRole = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return errorResponse(res, 400, "Role id is required");
    }
    if (isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid role id");
    }

    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res, 200, "Role deleted successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
}

// Export the function
module.exports = { resetPermissions, createRole, updateRole, deleteRole };
