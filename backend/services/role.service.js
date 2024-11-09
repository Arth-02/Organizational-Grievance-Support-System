const Role = require("../models/role.model");
const { isValidObjectId } = require("mongoose");
const {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
} = require("../validators/role.validator");
const { VIEW_PERMISSION, PERMISSIONS } = require("../utils/constant");
const User = require("../models/user.model");

// Create Role Service
const createRole = async (body, userData) => {
  try {
    const { organization_id } = userData;
    const { error, value } = createRoleSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const { name, permissions } = value;
    const role = new Role({
      name,
      permissions,
      organization_id,
    });
    await role.save();
    return { isSuccess: true, data: role };
  } catch (err) {
    console.error("Error creating role: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update Role Service
const updateRole = async (id, body, userData) => {
  try {
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Role Id", code: 400 };
    }
    const { organization_id } = userData;
    const { error, value } = updateRoleSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }

    const role = await Role.findOneAndUpdate(query, value, {
      new: true,
    });
    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }
    return { isSuccess: true, data: role };
  } catch (err) {
    console.error("Error updating role: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get Role By Id Service
const getRoleById = async (id, userData) => {
  try {
    const { organization_id } = userData;
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid id", code: 400 };
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const role = await Role.findOne(query);
    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }
    return { isSuccess: true, data: role };
  } catch (err) {
    console.error("Error getting role by id: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get All Role Name Service
const getAllRoleName = async (userData) => {
  try {
    const { organization_id } = userData;
    const query = { is_active: true };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const roles = await Role.find(query).select("name");
    if (!roles) {
      return { isSuccess: false, message: "Roles not found", code: 404 };
    }
    return { isSuccess: true, data: roles };
  } catch (err) {
    console.error("Error getting all roles name: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Get All Roles Service
const getAllRoles = async (userData, reqquery) => {
  try {
    const { organization_id } = userData;
    const {
      page = 1,
      limit = 10,
      is_active,
      name,
      permissions,
      sort_by = "created_at",
      permissionlogic = "or",
      order = "desc",
    } = reqquery;

    const userPermissions = [
      ...userData.role.permissions,
      ...userData.special_permissions,
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
      $project: {
        name: 1,
        ...(canViewPermissions && { permissions: 1 }),
        is_active: 1,
        organization_id: 1,
        created_at: 1,
      },
    });

    const [roles, totalRoles] = await Promise.all([
      Role.aggregate(pipeline),
      Role.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalRoles / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    if (roles.length === 0) {
      return { isSuccess: false, message: "Roles not found", code: 404 };
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

    return { isSuccess: true, data: roles, pagination };
  } catch (err) {
    console.error("Error getting all roles: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Delete Role Service
const deleteRole = async (session, id, userData, body) => {
  try {
    const { organization_id } = userData;
    const { error, value } = deleteRoleSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const { replace_role_id } = value;

    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid id", code: 400 };
    }

    const role = await Role.findOne({ _id: id, organization_id }).session(
      session
    );
    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }

    if (replace_role_id) {
      if (!isValidObjectId(replace_role_id)) {
        return {
          isSuccess: false,
          message: "Invalid replace role id",
          code: 400,
        };
      }

      const replaceRole = await Role.findOne({
        _id: replace_role_id,
        organization_id,
      }).session(session);
      if (!replaceRole) {
        return {
          isSuccess: false,
          message: "Replace role not found",
          code: 404,
        };
      }

      const userUpdate = await User.updateMany(
        { role: id, organization_id },
        { role: replace_role_id }
      ).session(session);

      if (userUpdate.modifiedCount === 0) {
        return {
          isSuccess: false,
          message: "No user found with this role",
          code: 404,
        };
      }
    } else {
      const userExist = await User.findOne({
        role: id,
        organization_id,
      }).session(session);
      if (userExist) {
        return {
          isSuccess: false,
          message: "This role is associated with some users",
          code: 400,
        };
      }
    }
    await Role.findOneAndDelete({ _id: id, organization_id }).session(session);
    return { isSuccess: true, message: "Role deleted successfully" };
  } catch (err) {
    console.error("Error deleting role: ", err);
    ``;
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// get count of users by role id
const getUsersCountByRoleId = async (id, userData) => {
  try {
    const { organization_id } = userData;
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid role ID", code: 400 };
    }
    const query = { role: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const usersCount = await User.countDocuments(query);
    return { isSuccess: true, data: usersCount };
  } catch (err) {
    console.error("Error getting users count by role id: ", err);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};
module.exports = {
  createRole,
  updateRole,
  getRoleById,
  getAllRoleName,
  getAllRoles,
  deleteRole,
  getUsersCountByRoleId,
};
