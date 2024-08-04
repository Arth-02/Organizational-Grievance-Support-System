const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/user.model");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const {
  PERMISSIONS,
  ADD_USER,
  UPDATE_USER,
  DELETE_USER,
  VIEW_USER,
  UPDATE_USER_ROLE,
  UPDATE_GRIEVANCE,
  DELETE_GRIEVANCE,
  UPDATE_GRIEVANCE_STATUS,
  ADD_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
} = require("../utils/constant");


// Joi validation schema
const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
  rememberMe: Joi.boolean().default(false),
});

// @route POST /api/auth/login
// @desc Login user
// @access Public
async function login(req, res) {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }
    
    const { email, password, rememberMe } = value;
    
    // Check if user exists and is active
    const user = await User.findOne({ email, is_active: true }).select("+password");
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
        id: user.id
      },
    };
    const tokenExpiration = rememberMe ? "15d" : "8d";

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: tokenExpiration,
    });

    // Update last login
    user.last_login = Date.now();
    await user.save();

    // Prepare user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      token,
    };

    // Send success response with token and user data
    return successResponse(res, userData, "Login successful");
  } catch (err) {
    console.error("Login Error:", err.message);
    return catchResponse(res);
  }
}

// Joi validation schema for registration
const registerSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required(),
  role: Joi.string()
    .trim()
    .valid("employee", "hr", "admin")
    .default("employee"),
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  department: Joi.string().trim().required(),
  employee_id: Joi.string().trim().required(),
  phone_number: Joi.string().trim().allow(""),
  is_active: Joi.boolean().default(true),
});

// @route POST /api/auth/register
// @desc Register new user
// @access Public
async function register(req, res) {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body, {
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
    } = value;

    // Check if user already exists
    let existingUser = await User.findOne({
      $or: [{ email }, { username }, { employee_id }],
    });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists");
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
    });

    // Save user to database
    await newUser.save();

    // Create and sign JWT token
    const payload = {
      user: {
        id: newUser.id
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
      is_active: newUser.is_active,
      token,
    };

    // Send success response
    return successResponse(res, userData, "User registered successfully");
  } catch (err) {
    console.error("Registration Error:", err.message);
    return catchResponse(res);
  }
}

// @route GET /api/profile
// @desc Get user profile
// @access Private
async function getProfile(req, res) {
  try {
    console.log(req.user.id);
    const user = await User.findById(req.user.id).select(
      "-createdAt -updatedAt -last_login -is_active"
    );
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, user, "Profile retrieved successfully");
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    return catchResponse(res);
  }
}

// Joi validation schema for updating profile
const updateProfileSchema = Joi.object({
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  phone_number: Joi.string().trim().allow(""),
  username: Joi.string().trim().alphanum().min(3).max(30).required(),
});

// @route PUT /api/profile
// @desc Update user profile
// @access Private
async function updateProfile(req, res) {
  try {
    const { error, value } = updateProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, "Validation error", errors);
    }
    // Find and update the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    const { firstname, lastname, phone_number, username } = value;

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (username) user.username = username;

    await user.save();
    return successResponse(res, {}, "Profile updated successfully");
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return catchResponse(res);
  }
}

module.exports = { login, register, getProfile, updateProfile };
