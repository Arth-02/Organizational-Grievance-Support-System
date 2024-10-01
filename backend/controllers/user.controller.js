const { isValidObjectId, default: mongoose } = require("mongoose");
const { ObjectId } = mongoose.Types;
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/user.model");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const Organization = require("../models/organization.model");
const {
  DEFAULT_ADMIN_PERMISSIONS,
  SUPER_ADMIN,
  ADMIN,
} = require("../utils/constant");
const Role = require("../models/role.model");
const Department = require("../models/department.model");
const { sendEmail } = require("../utils/mail");
const { generateOTP } = require("../utils/common");
const bcrypt = require("bcryptjs");
const {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  superAdminSchema,
} = require("../validators/user.validator");

// Login user
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const { email, username, password, rememberMe } = value;

    const user = await User.findOne({
      $or: [{ email }, { username }],
      is_active: true,
    })
      .select("+password")
      .populate({ path: "role", select: "name" })
      .populate({ path: "department", select: "name" })
      .populate({ path: "organization_id", select: "name logo" });
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 400, "Invalid password");
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
      token,
    };

    // Send success response with token and user data
    return successResponse(res, userData, "Login successful");
  } catch (err) {
    console.error("Login Error:", err.message);
    return catchResponse(res);
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { organization_id } = req.user;
    // Validate request body.
    const { error, value } = createUserSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
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
      return errorResponse(res, 400, "Invalid Role id");
    }
    if (!isValidObjectId(department)) {
      return errorResponse(res, 400, "Invalid Department id");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employee_id }],
      organization_id,
      is_deleted: false,
    });
    if (existingUser) {
      return errorResponse(
        res,
        400,
        "User already exists with this email, username or employee ID"
      );
    }

    const existingOrganization = await Organization.findById(organization_id);
    if (!existingOrganization) {
      return errorResponse(res, 404, "Organization not found");
    }

    const userRole = await Role.findById(role);
    if (!userRole) {
      return errorResponse(res, 404, "Role not found");
    }
    const userDepartment = await Department.findById(department);
    if (!userDepartment) {
      return errorResponse(res, 404, "Department not found");
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

    // Save user to database
    await newUser.save();

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
    return successResponse(res, userData, "User created successfully", 201);
  } catch (err) {
    console.error("Registration Error:", err.message);
    return catchResponse(res);
  }
};

// Get user profile
const getUser = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const id = req.params.id || req.user.id;
    if (!id) {
      return errorResponse(res, 400, "User id is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid user id");
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const user = await User.findOne(query).select(
      "-createdAt -updatedAt -last_login -is_active -is_deleted"
    );
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    console.log("User:", user);

    return successResponse(res, user, "Profile retrieved successfully");
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    return catchResponse(res);
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const id = req.params.id || req.user.id;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid department ID");
    }
    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, "Validation error", errors);
    }
    const query = { _id: id };

    if (organization_id) {
      query.organization_id = organization_id;
    }
    const user = await User.findOneAndUpdate(query, value, {
      new: true,
    });
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, user, "Profile updated successfully");
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return catchResponse(res);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const id = req.params.id;
    if (!id) {
      return errorResponse(res, 400, "User id is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid user id");
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
      return errorResponse(res, 404, "User not found");
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
    const { organization_id } = req.user;
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return errorResponse(res, 400, "User ids are required");
    }
    for (let i = 0; i < ids.length; i++) {
      if (!isValidObjectId(ids[i])) {
        return errorResponse(res, 400, "Invalid user id");
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
      return errorResponse(res, 404, "Users not found");
    }

    return successResponse(res, {}, "Users deleted successfully");
  } catch (err) {
    console.error("Delete Users Error:", err.message);
    return catchResponse(res);
  }
};

// Create super admin
const createSuperAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { error, value } = superAdminSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
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
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(organization_id).session(
      session
    );
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }

    if (!organization.otp) {
      return errorResponse(res, 400, "OTP has expired");
    }

    const isOtpValid = await bcrypt.compare(otp, organization.otp);
    if (!isOtpValid) {
      return errorResponse(res, 400, "Invalid OTP");
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
      return errorResponse(
        res,
        400,
        "Super Admin already exists with this email"
      );
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

    await session.commitTransaction();
    return successResponse(
      res,
      userData,
      "Super Admin created successfully",
      201
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
    const { organization_id } = req.body;

    if (!organization_id) {
      return errorResponse(res, 400, "Organization id is required");
    }

    if (!isValidObjectId(organization_id)) {
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(organization_id).select(
      "email"
    );
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
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
      return errorResponse(res, 500, "Failed to send OTP");
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
    const schema = Joi.object({
      username: Joi.string().trim().min(3).max(30).required(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    const { username } = value;

    const query = { username, is_deleted: false };
    if (req.user?.organization_id) {
      query.organization_id = req.user.organization_id;
    }

    const user = await User.findOne(query);
    if (user) {
      return successResponse(res, { exists: true }, "Username exists");
    }
    return successResponse(res, { exists: false }, "Username available");
  } catch (err) {
    console.error("Check Username Error:", err.message);
    return catchResponse(res);
  }
};

// Check if email exists
const checkEmail = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().trim().email().required(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    const { email } = value;

    const query = { email, is_deleted: false };

    if (req.user?.organization_id) {
      query.organization_id = req.user.organization_id;
    }

    const user = await User.findOne(query);
    if (user) {
      return successResponse(res, { exists: true }, "Email exists");
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
    const schema = Joi.object({
      employee_id: Joi.string().trim().required(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    const { employee_id } = value;
    const { organization_id } = req.user;
    const user = await User.findOne({
      employee_id,
      organization_id,
      is_deleted: false,
    });
    if (user) {
      return successResponse(res, { exists: true }, "Employee ID exists");
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
    const { organization_id, _id } = req.user;
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
      sort_by = "created_at",
      order = "desc",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
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
    if (role) {
      query.role = new ObjectId(role);
    }
    if (department) {
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
      },
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
      },
      {
        $addFields: {
          merged_permissions: {
            $concatArrays: ["$role.permissions", "$special_permissions"],
          },
        },
      }
    );

    if (isSortedFieldPresent) {
      pipeline.push(
        { $addFields: { sortField: { $toLower: `$${sort_by}.name` } } },
        { $sort: { sortField: sortOrder } },
        { $skip: skip },
        { $limit: limitNumber }
      );
    }

    if (permissions) {
      pipeline.push({
        $match: {
          $expr: {
            $setIsSubset: [permissions.split(","), "$merged_permissions"],
          },
        },
      });
    }

    pipeline.push({
      $project: {
        role: "$role.name",
        role_permissions: "$role.permissions",
        department: "$department.name",
        username: 1,
        email: 1,
        firstname: 1,
        lastname: 1,
        employee_id: 1,
        phone_number: 1,
        is_active: 1,
        special_permissions: 1,
        last_login: 1,
        created_at: 1,
      },
    });

    const [users, totalUsers] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalUsers / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!users.length) {
      return errorResponse(res, 404, "Users not found");
    }
    return successResponse(
      res,
      {
        users,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: pageNumber,
          pageSize: limitNumber,
          hasNextPage,
          hasPrevPage,
        },
      },
      "Users retrieved successfully"
    );
  } catch (err) {
    console.error("Get Users Error:", err.message);
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
};
