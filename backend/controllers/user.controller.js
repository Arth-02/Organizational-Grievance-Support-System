const { isValidObjectId, default: mongoose } = require("mongoose");
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
async function login(req, res) {
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
    }).select("+password");
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
}

// Create new user
async function createUser(req, res) {
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
}

// Get user profile
async function getUser(req, res) {
  try {
    const { organization_id } = req.user;
    const id = req.params.id || req.user.id;
    if (!id) {
      return errorResponse(res, 400, "User id is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid user id");
    }
    const user = await User.findOne({ _id: id, organization_id }).select(
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
}

// Update user profile
async function updateUser(req, res) {
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
    // Find and update the user
    const user = await User.findOneAndUpdate(
      { _id: id, organization_id },
      value,
      {
        new: true,
      }
    );
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, user, "Profile updated successfully");
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return catchResponse(res);
  }
}

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
    const user = await User.findOneAndUpdate(
      { _id: id, organization_id },
      { is_active: false, is_deleted: true }
    );
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, {}, "User deleted successfully");
  } catch (err) {
    console.error("Delete User Error:", err.message);
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

    const { organization_id } = req.user;
    const user = await User.findOne({
      username,
      organization_id,
      is_deleted: false,
    });
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

    const { organization_id } = req.user;
    const user = await User.findOne({
      email,
      organization_id,
      is_deleted: false,
    });
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

module.exports = {
  login,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  createSuperAdmin,
  sendOTPEmail,
  checkUsername,
  checkEmail,
  checkEmployeeID,
};
