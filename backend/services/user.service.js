const User = require("../models/user.model");
const {
  PERMISSIONS,
  SUPER_ADMIN,
  DEFAULT_ADMIN_PERMISSIONS,
  VIEW_PERMISSION,
  VIEW_ROLE,
  VIEW_DEPARTMENT,
} = require("../utils/constant");
const {
  loginSchema,
  createUserSchema,
  updateFullUserSchema,
  updateSelfUserSchema,
} = require("../validators/user.validator");
const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("mongoose");
const Role = require("../models/role.model");
const Department = require("../models/department.model");
const Organization = require("../models/organization.model");
const attachmentService = require("./attachment.service");
const { generateOTP } = require("../utils/common");
const { sendEmail } = require("../utils/mail");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { ObjectId } = require("mongoose").Types;
const boardService = require("./board.service");

// User login service
const userLogin = async (body) => {
  try {
    const { error, value } = loginSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: error };
    }

    const { email, username, password, rememberMe } = value;

    const user = await User.findOne({
      $or: [{ email }, { username }],
      is_active: true,
    })
      .select("+password")
      .populate("role")
      .populate("department")
      .populate({ path: "organization_id", select: "name logo" });
    if (!user) {
      return { isSuccess: false, message: "User not found" };
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return { isSuccess: false, message: "Invalid password" };
    }

    // User authenticated, create token
    const payload = {
      user: {
        id: user.id,
      },
    };
    const tokenExpiration = rememberMe ? "15d" : "8d";

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: tokenExpiration,
    });

    // Update last login
    user.last_login = Date.now();
    await User.findByIdAndUpdate(user.id, { last_login: user.last_login });

    // Prepare user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      department: user.department,
      special_permissions: user.special_permissions,
      token,
    };

    // Send success response with token and user data
    return { isSuccess: true, data: userData };
  } catch (err) {
    console.error("Login Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Create user service
const createUser = async (session, body, userData, files) => {
  const { organization_id } = userData;
  try {
    const { error, value } = createUserSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }

    const {
      username,
      email,
      password,
      role,
      firstname,
      lastname,
      department,
      employee_id,
      phone_number,
      is_active,
      special_permissions,
    } = value;

    if (!isValidObjectId(role)) {
      return { isSuccess: false, message: "Invalid Role id" };
    }
    if (!isValidObjectId(department)) {
      return { isSuccess: false, message: "Invalid Department id" };
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employee_id }],
      organization_id,
      is_deleted: false,
    }).session(session);
    if (existingUser) {
      return {
        isSuccess: false,
        message: "User already exists with this email, username or employee ID",
      };
    }

    const existingOrganization = await Organization.findById(
      organization_id
    ).session(session);
    if (!existingOrganization) {
      return { isSuccess: false, message: "Organization not found" };
    }

    const userRole = await Role.findById(role).session(session);
    if (!userRole) {
      return { isSuccess: false, message: "Role not found" };
    }
    const userDepartment = await Department.findById(department).session(
      session
    );
    if (!userDepartment) {
      return { isSuccess: false, message: "Department not found" };
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Password will be hashed by the pre-save hook
      role,
      firstname,
      lastname,
      department,
      employee_id,
      phone_number,
      is_active,
      organization_id,
      special_permissions,
    });
    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        newUser._id,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        await session.abortTransaction();
        return { isSuccess: false, message: response.message };
      }
      newUser.image_id = response.attachmentIds[0];
    }
    await newUser.save({ session });

    // Create and sign JWT token
    const payload = {
      user: {
        id: newUser.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Prepare user data for response
    const userData = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      employee_id: newUser.employee_id,
      department: newUser.department,
      token,
    };

    // Send success response
    await session.commitTransaction();
    return { isSuccess: true, data: userData };
  } catch (err) {
    console.error("Registration Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Get user Details service
const getUserDetails = async (user_id, userData) => {
  try {
    const { organization_id } = userData;
    const id = user_id || userData.id;
    if (!id) {
      return { isSuccess: false, message: "User id is Required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid user id" };
    }
    const query = { _id: id, is_deleted: false };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    let user;
    if (!user_id) {
      user = await User.findOne(query)
        .populate("role")
        .populate("department")
        .populate({ path: "image_id", select: "filename public_id url" })
        .select("-createdAt -updatedAt -last_login -is_active -is_deleted")
        .lean();
      user.role.permissions = user.role.permissions
        .map((permissionSlug) =>
          PERMISSIONS.find((p) => p.slug === permissionSlug)
        )
        .filter(Boolean);
    } else {
      user = await User.findOne(query).select(
        "-createdAt -updatedAt -last_login -is_active -is_deleted"
      );
    }
    if (!user) {
      return { isSuccess: false, message: "User not found" };
    }

    return { isSuccess: true, data: user };
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Update user Details service
const updateUserDetails = async (user_id, userData, body, files) => {
  try {
    const { organization_id } = userData;
    let schema, id;
    if (user_id) {
      schema = updateFullUserSchema;
      id = user_id;
    } else if (userData.id) {
      schema = updateSelfUserSchema;
      id = userData.id;
    } else {
      return errorResponse(res, 400, "User ID is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid user ID");
    }
    const { error, value } = schema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    const query = { _id: id };

    if (organization_id) {
      query.organization_id = organization_id;
    }
    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        null,
        id,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      value.image_id = response.attachmentIds[0];
    }
    const user = await User.findOneAndUpdate(query, value, {
      new: true,
    });
    if (!user) {
      return { isSuccess: false, message: "User not found" };
    }
    return { isSuccess: true, data: user };
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Delete user service
const deleteUser = async (user_id, userData) => {
  try {
    const { organization_id } = userData;
    const id = user_id;
    if (!id) {
      return { isSuccess: false, message: "User id is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid user id" };
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const user = await User.findOneAndUpdate(query, {
      is_active: false,
      is_deleted: true,
    });
    if (!user) {
      return { isSuccess: false, message: "User not found" };
    }

    return { isSuccess: true };
  } catch (err) {
    console.error("Delete User Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Delete Multiple Users service
const deleteMultipleUsers = async (body, userData) => {
  try {
    const { organization_id } = userData;
    const { ids } = body;
    if (!ids || !ids.length) {
      return { isSuccess: false, message: "User ids are required" };
    }
    for (let i = 0; i < ids.length; i++) {
      if (!isValidObjectId(ids[i])) {
        return { isSuccess: false, message: "Invalid user id" };
      }
    }
    const query = { _id: { $in: ids } };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const users = await User.updateMany(query, {
      is_active: false,
      is_deleted: true,
    });
    if (!users) {
      return { isSuccess: false, message: "Users not found" };
    }

    return { isSuccess: true };
  } catch (err) {
    console.error("Delete Users Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Create Super Admin service
const createSuperAdmin = async (session, body, files) => {
  try {
    const { error, value } = superAdminSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    const {
      firstname,
      lastname,
      username,
      email,
      password,
      employee_id,
      organization_id,
      phone_number,
      otp,
    } = value;

    if (!isValidObjectId(organization_id)) {
      return { isSuccess: false, message: "Invalid Organization ID" };
    }

    const organization = await Organization.findById(organization_id).session(
      session
    );
    if (!organization) {
      return { isSuccess: false, message: "Organization not found" };
    }

    if (!organization.otp) {
      return { isSuccess: false, message: "OTP not generated" };
    }

    const isOtpValid = await bcrypt.compare(otp, organization.otp);
    if (!isOtpValid) {
      return { isSuccess: false, message: "Invalid OTP" };
    }

    const existing = await User.findOne({
      $and: [
        {
          $or: [{ email }, { username }, { employee_id }],
        },
        { organization_id },
      ],
    }).session(session);
    if (existing) {
      return { isSuccess: false, message: "User already exists" };
    }

    const newRole = new Role({
      name: SUPER_ADMIN,
      permissions: DEFAULT_ADMIN_PERMISSIONS,
      organization_id,
    });
    const role = await newRole.save({ session });

    const newDepartment = new Department({
      name: ADMIN,
      description: "Admin Department",
      organization_id,
    });
    const department = await newDepartment.save({ session });

    const superAdmin = new User({
      username,
      email,
      password,
      role: role._id,
      department: department._id,
      firstname,
      lastname,
      employee_id,
      phone_number,
      organization_id,
    });
    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        superAdmin._id,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      superAdmin.image_id = response.attachmentIds[0];
    }
    await superAdmin.save({ session });
    const payload = {
      user: {
        id: superAdmin.id,
      },
    };
    const tokenExpiration = "8d";

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: tokenExpiration,
    });

    const userData = {
      id: superAdmin._id,
      username: superAdmin.username,
      email: superAdmin.email,
      role: superAdmin.role,
      fullName: superAdmin.fullName,
      employee_id: superAdmin.employee_id,
      department: superAdmin.department,
      token,
    };

    return { isSuccess: true, data: userData };
  } catch (err) {
    console.error("Create Super Admin Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Send OTP Email service
const sendOTPEmail = async (organization_id) => {
  try {
    if (!organization_id) {
      return { isSuccess: false, message: "Organization ID is required" };
    }

    if (!isValidObjectId(organization_id)) {
      return { isSuccess: false, message: "Invalid Organization ID" };
    }

    const organization = await Organization.findById(organization_id).select(
      "email"
    );
    if (!organization) {
      return { isSuccess: false, message: "Organization not found" };
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    organization.otp = hashedOTP;
    await organization.save();

    // remove otp after 5 minutes
    setTimeout(async () => {
      await Organization.updateOne(
        { _id: organization_id },
        { $unset: { otp: "" } }
      );
    }, 300000);

    // Send OTP to email
    const isMailSent = await sendEmail(
      organization.email,
      "Email Verification",
      `<h1>Your OTP is ${otp}</h1>`
    );
    if (!isMailSent) {
      return { isSuccess: false, message: "Failed to send OTP" };
    }

    return { isSuccess: true, message: "OTP sent successfully" };
  } catch (err) {
    console.error("Generate OTP Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Check if user field is available service
const checkUserField = async (body, userData, type) => {
  try {
    let schema;
    let field;

    // Define schema and field name based on type
    if (type === "Username") {
      schema = Joi.object({
        username: Joi.string().trim().min(3).max(30).required(),
      });
      field = "username";
    } else if (type === "Email") {
      schema = Joi.object({
        email: Joi.string().trim().email().required(),
      });
      field = "email";
    } else if (type === "Employee ID") {
      schema = Joi.object({
        employee_id: Joi.string().trim().required(),
      });
      field = "employee_id";
    } else {
      return { isSuccess: false, message: "invalid type" };
    }

    const { error, value } = schema.validate(body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }

    const query = { [field]: value[field], is_deleted: false };
    if (userData?.organization_id) {
      query.organization_id = userData.organization_id;
    }

    const user = await User.findOne(query);
    if (user) {
      return { isSuccess: true, exists: true, message: `${type} unavailable` };
    }

    return { isSuccess: true, exists: false, message: `${type} available` };
  } catch (err) {
    console.error(`check ${type} error:`, err.message);
    return { isSuccess: false, message: "internal server error" };
  }
};

// Get all users service
const getAllUsers = async (reqquery, userData) => {
  try {
    const { organization_id, _id } = userData;
    const {
      page = 1,
      limit = 10,
      username,
      is_active,
      employee_id,
      role,
      email,
      department,
      permissions,
      permissionlogic = "or",
      sort_by = "created_at",
      order = "desc",
    } = reqquery;

    const userPermissions = [
      ...userData.role.permissions,
      ...userData.special_permissions,
    ];
    const canViewPermissions = userPermissions.includes(VIEW_PERMISSION.slug);
    const canViewRoles = userPermissions.includes(VIEW_ROLE.slug);
    const canViewDepartments = userPermissions.includes(VIEW_DEPARTMENT.slug);

    const pageNumber = Number.isInteger(parseInt(page, 10))
      ? parseInt(page, 10)
      : 1;
    const limitNumber = Number.isInteger(parseInt(limit, 10))
      ? parseInt(limit, 10)
      : 10;
    const skip = (pageNumber - 1) * limitNumber;
    const query = { is_deleted: false, _id: { $ne: _id } };
    if (is_active === "true" || is_active === "false") {
      query.is_active = is_active === "true";
    }
    if (organization_id) {
      query.organization_id = organization_id;
    }
    if (username) {
      query.username = { $regex: username, $options: "i" };
    }
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }
    if (employee_id) {
      query.employee_id = { $regex: employee_id, $options: "i" };
    }
    if (role && canViewRoles) {
      query.role = new ObjectId(role);
    }
    if (department && canViewDepartments) {
      query.department = new ObjectId(department);
    }

    const isSortedFieldPresent = sort_by === "role" || sort_by === "department";

    const sortOrder = order === "asc" ? 1 : -1;
    const pipeline = [{ $match: query }];

    if (!isSortedFieldPresent) {
      pipeline.push(
        { $addFields: { sortField: { $toLower: `$${sort_by}` } } },
        { $sort: { sortField: sortOrder } },
        { $skip: skip },
        { $limit: limitNumber }
      );
    }

    if (canViewRoles) {
      pipeline.push(
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $unwind: {
            path: "$role",
            preserveNullAndEmptyArrays: true,
          },
        }
      );
    }
    if (canViewDepartments) {
      pipeline.push(
        {
          $lookup: {
            from: "departments",
            localField: "department",
            foreignField: "_id",
            as: "department",
          },
        },
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true,
          },
        }
      );
    }
    if (permissions && canViewPermissions) {
      pipeline.push({
        $addFields: {
          merged_permissions: {
            $concatArrays: ["$role.permissions", "$special_permissions"],
          },
        },
      });
    }

    if (isSortedFieldPresent) {
      pipeline.push(
        { $addFields: { sortField: { $toLower: `$${sort_by}.name` } } },
        { $sort: { sortField: sortOrder } },
        { $skip: skip },
        { $limit: limitNumber }
      );
    }

    if (permissions && canViewPermissions) {
      const permissionArray = permissions.split(",");

      if (permissionlogic === "or") {
        pipeline.push({
          $match: {
            $expr: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [permissionArray, "$merged_permissions"],
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
              $setIsSubset: [permissionArray, "$merged_permissions"],
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
              $setIsSubset: [permissionArray, "$merged_permissions"],
            },
          },
        });
      }
    }

    pipeline.push({
      $project: {
        ...(canViewRoles && {
          role: "$role.name",
        }),
        ...(canViewPermissions && {
          role_permissions: "$role.permissions",
          special_permissions: 1,
        }),
        ...(canViewDepartments && {
          department: "$department.name",
        }),
        username: 1,
        email: 1,
        firstname: 1,
        lastname: 1,
        employee_id: 1,
        phone_number: 1,
        is_active: 1,
        last_login: 1,
        created_at: 1,
      },
    });

    const [users, totalUsers] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(query),
    ]);

    if (!users.length) {
      return { isSuccess: false, message: "Users not Found" };
    }
    if (canViewPermissions) {
      for (let i = 0; i < users.length; i++) {
        users[i].role_permissions = users[i].role_permissions
          .map((permissionSlug) =>
            PERMISSIONS.find((p) => p.slug === permissionSlug)
          )
          .filter(Boolean);
        users[i].special_permissions = users[i].special_permissions
          .map((permissionSlug) =>
            PERMISSIONS.find((p) => p.slug === permissionSlug)
          )
          .filter(Boolean);
      }
    }
    const totalPages = Math.ceil(totalUsers / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const pagination = {
      totalItems: totalUsers,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    };

    return { isSuccess: true, data: users, pagination };
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Get All Users Id service
const getAllUsersId = async (userData) => {
  try {
    const { organization_id } = userData;
    const users = await User.find({ organization_id }, "_id");
    const userIds = users.map((user) => user._id);
    return { isSuccess: true, data: userIds };
  } catch (err) {
    console.error("Get Users Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Add Board to User service
const addBoardToUser = async (session, body, userData) => {
  try {
    const { organization_id, id: userId } = userData;
    const response = await boardService.createBoard(
      session,
      organization_id,
      body
    );
    if (!response.isSuccess) {
      return { isSuccess: false, message: response.message };
    }
    const board = response.board;
    const user = await User.findByIdAndUpdate(userId, {
      $push: { board_id: board._id },
    }).session(session);
    if (!user) {
      return { isSuccess: false, message: "User not found" };
    }
    return { isSuccess: true, data: board };
  } catch (err) {
    console.error("Create Board Error:", err.message);
    return { isSuccess: false, message: "Internal server error" };
  }
};

module.exports = {
  userLogin,
  createUser,
  getUserDetails,
  updateUserDetails,
  deleteUser,
  deleteMultipleUsers,
  createSuperAdmin,
  sendOTPEmail,
  checkUserField,
  getAllUsers,
  getAllUsersId,
  addBoardToUser,
};
