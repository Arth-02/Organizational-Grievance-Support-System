const Joi = require("joi");
const Role = require("../models/role.model");
const { DEFAULT_PERMISSIONS } = require("../utils/constant");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { isValidObjectId, default: mongoose } = require("mongoose");

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
    return successResponse(res, {}, "Permissions reset successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permission_id: Joi.array().items(Joi.number()).required(),
  organization_id: Joi.string().trim().required(),
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
      organization_id,
    });
    await role.save();
    return successResponse(res, role, "Role created successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

const updateRoleSchema = Joi.object({
  name: Joi.string().trim(),
  permission_id: Joi.array().items(Joi.number()),
});

const updateRole = async (req, res) => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const role = await Role.findOneAndUpdate({ _id: req.params.id }, value, {
      new: true,
    });
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res,role,"Role updated successfully" );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// get role by id
const getRoleById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, "Invalid id");
    }
    const role = await Role.findById(req.params.id);
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res, role, "Role retrieved successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// get all roles

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    return successResponse(res, roles,"Roles retrieved successfully" );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// Delete role schema
const deleteRoleSchema = Joi.object({
  id: Joi.string().trim().required(),
  replace_role_id: Joi.string().trim(),
});

const deleteRole = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { error, value } = deleteRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const { id, replace_role_id } = value;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid id");
    }

    const role = await Role.findById(id).session(session);
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }

    if (replace_role_id) {
      if (!isValidObjectId(replace_role_id)) {
        return errorResponse(res, 400, "Invalid replace_role_id");
      }

      const replaceRole = await Role.findById(replace_role_id).session(session);
      if (!replaceRole) {
        return errorResponse(res, 404, "Replace role not found");
      }

      const userUpdate = await User.updateMany(
        { role: id },
        { role: replace_role_id }
      ).session(session);

      if (userUpdate.modifiedCount === 0) {
        return errorResponse(res, 404, "No users found to update");
      }
    } else {
      const userExist = await User.findOne({ role: id }).session(session);
      if (userExist) {
        return errorResponse(res, 400, "Role is assigned to a user");
      }
    }

    await Role.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
    return successResponse(res, {}, "Role deleted successfully");
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Export the function
module.exports = { resetPermissions, createRole, updateRole, deleteRole, getRoleById, getAllRoles };
