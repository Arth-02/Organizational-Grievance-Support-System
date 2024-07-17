const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/user.model");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");

// Joi validation schema
const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
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
    const user = await User.findOne({ email, isActive: true });
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
        role: user.role,
      },
    };
    const tokenExpiration = rememberMe ? "15d" : "8d";

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: tokenExpiration,
    });

    // Update last login
    user.lastLogin = Date.now();
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
  role: Joi.string().trim().valid("employee", "hr", "admin").default("employee"),
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  department: Joi.string().trim().required(),
  employeeId: Joi.string().trim().required(),
  phoneNumber: Joi.string().trim().allow(""),
  isActive: Joi.boolean().default(true),
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
      firstName,
      lastName,
      department,
      employeeId,
      phoneNumber,
      isActive,
    } = value;

    // Check if user already exists
    let existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId }],
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
      firstName,
      lastName,
      department,
      employeeId,
      phoneNumber,
      isActive,
    });

    // Save user to database
    await newUser.save();

    // Create and sign JWT token
    const payload = {
      user: {
        id: newUser.id,
        role: newUser.role,
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
      employeeId: newUser.employeeId,
      department: newUser.department,
      isActive: newUser.isActive,
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
    const user = await User.findById(req.user.id).select("-createdAt -updatedAt -lastLogin -isActive");
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
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  phoneNumber: Joi.string().trim().allow(""),
  email: Joi.string().trim().email().required(),
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
    const { firstName, lastName, email, phoneNumber, username } = value;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (username) user.username = username;

    await user.save();
    return successResponse(
      res,
      {},
      "Profile updated successfully"
    );
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    return catchResponse(res);
  }
}

module.exports = { login, register,  getProfile, updateProfile };
