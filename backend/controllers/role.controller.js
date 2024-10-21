const Role = require("../models/role.model");
const User = require("../models/user.model");
const {
  DEFAULT_PERMISSIONS,
  PERMISSIONS,
  VIEW_PERMISSION,
} = require("../utils/constant");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { isValidObjectId, default: mongoose } = require("mongoose");
const {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
} = require("../validators/role.validator");

// cmd function to reset all permissons for each role
const resetPermissions = async (req, res) => {
  try {
    for (let i = 0; i < DEFAULT_PERMISSIONS.length; i++) {
      const newRole = {
        name: DEFAULT_PERMISSIONS[i].name,
        permissions: DEFAULT_PERMISSIONS[i].permissions,
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

// create a new role
const createRole = async (req, res) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    const { organization_id } = req.user;

    const { name, permissions } = value;

    const role = new Role({
      name,
      permissions,
      organization_id,
    });
    await role.save();
    return successResponse(res, role, "Role created successfully", 201);
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// update role
const updateRole = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, "Invalid id");
    }
    const { organization_id } = req.user;
    const { error, value } = updateRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    const query = { _id: req.params.id };
    if (organization_id) {
      query.organization_id = organization_id;
    }

    const role = await Role.findOneAndUpdate(query, value, {
      new: true,
    });
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res, role, "Role updated successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// get role by id
const getRoleById = async (req, res) => {
  try {
    const { organization_id } = req.user;
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, "Invalid id");
    }
    const query = { _id: req.params.id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const role = await Role.findOne(query);
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }
    return successResponse(res, role, "Role retrieved successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// get all roles name and id
const getAllRoleName = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const query = { is_active: true };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const roles = await Role.find(query).select("name");
    return successResponse(res, roles, "Roles retrieved successfully");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// get all roles in pagination
const getAllRoles = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const {
      page = 1,
      limit = 10,
      is_active,
      name,
      permissions,
      sort_by = "created_at",
      permissionlogic = "or",
      order = "desc",
    } = req.query;

    const userPermissions = [
      ...req.user.role.permissions,
      ...req.user.special_permissions,
    ];

    const canViewPermissions = userPermissions.includes(VIEW_PERMISSION.slug);

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {};
    if (organization_id) {
      query.organization_id = organization_id;
    }
    if (is_active == "true" || is_active == "false") {
      query.is_active = is_active == "true";
    }
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    const pipeline = [{ $match: query }];

    if (permissions && canViewPermissions) {
      const permissionArray = permissions.split(",");
      if (permissionlogic === "or") {
        pipeline.push({
          $match: {
            $expr: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [permissionArray, "$permissions"],
                  },
                },
                0,
              ],
            },
          },
        });
      } else if (permissionlogic === "and") {
        pipeline.push({
          $match: {
            $expr: {
              $setIsSubset: [permissionArray, "$permissions"],
            },
          },
        });
      } else {
        console.warn(
          `Invalid permissionLogic: ${permissionlogic}. Defaulting to "and" logic.`
        );
        pipeline.push({
          $match: {
            $expr: {
              $setIsSubset: [permissionArray, "$permissions"],
            },
          },
        });
      }
    }

    pipeline.push(
      { $sort: { [sort_by]: order === "desc" ? -1 : 1 } },
      { $skip: skip },
      { $limit: limitNumber }
    );

    pipeline.push({
      $facet: {
        roles: [
          {
            $project: {
              name: 1,
              ...(canViewPermissions && { permissions: 1 }),
              is_active: 1,
              organization_id: 1,
              created_at: 1,
            },
          },
        ],
        totalRoles: [{ $count: "count" }],
      },
    });

    const [result] = await Role.aggregate(pipeline);

    const roles = result.roles || [];
    const totalRoles = result.totalRoles.length
      ? result.totalRoles[0].count
      : 0;
    const totalPages = Math.ceil(totalRoles / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    if (roles.length === 0) {
      return errorResponse(res, 404, "No roles found");
    }
    if (canViewPermissions) {
      for (let i = 0; i < roles.length; i++) {
        roles[i].permissions = roles[i].permissions
          .map((permissionSlug) =>
            PERMISSIONS.find((p) => p.slug === permissionSlug)
          )
          .filter(Boolean);
      }
    }

    const pagination = {
      totalItems: totalRoles,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    };

    return successResponse(
      res,
      { roles, pagination },
      "Roles retrieved successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// delete role
const deleteRole = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { organization_id } = req.user;
    const { error, value } = deleteRoleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const id = req.params.id;

    const { replace_role_id } = value;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid id");
    }

    const role = await Role.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!role) {
      return errorResponse(res, 404, "Role not found");
    }

    if (replace_role_id) {
      if (!isValidObjectId(replace_role_id)) {
        return errorResponse(res, 400, "Invalid replace_role_id");
      }

      const replaceRole = await Role.findOne({
        _id: replace_role_id,
        organization_id,
      }).session(session);
      if (!replaceRole) {
        return errorResponse(res, 404, "Replace role not found");
      }

      const userUpdate = await User.updateMany(
        { role: id, organization_id },
        { role: replace_role_id }
      ).session(session);

      if (userUpdate.modifiedCount === 0) {
        return errorResponse(res, 404, "No users found to update");
      }
    } else {
      const userExist = await User.findOne({
        role: id,
        organization_id,
      }).session(session);
      if (userExist) {
        return errorResponse(res, 400, "Role is assigned to a user");
      }
    }

    await Role.findOneAndDelete({ _id: id, organization_id }).session(session);
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

// get count of users by role id
const getUsersCountByRoleId = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid role ID");
    }
    const query = { role: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const usersCount = await User.countDocuments(query);
    return successResponse(
      res,
      usersCount,
      "Users count retrieved successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

// Export the function
module.exports = {
  resetPermissions,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getAllRoleName,
  getAllRoles,
  getUsersCountByRoleId,
};
