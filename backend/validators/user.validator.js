const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().trim().email(),
  username: Joi.string().trim(),
  password: Joi.string().trim().required(),
  rememberMe: Joi.boolean().default(false),
}).xor('email', 'username');

const createUserSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required(),
  role: Joi.string().trim().required(),
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  department: Joi.string().trim().required(),
  employee_id: Joi.string().trim().required(),
  phone_number: Joi.string().trim().allow(""),
  is_active: Joi.boolean().default(true),
  is_deleted: Joi.boolean().default(false),
  special_permissions: Joi.array().items(Joi.string()).default([]),
});

const updateUserSchema = Joi.object({
  firstname: Joi.string().trim(),
  lastname: Joi.string().trim(),
  phone_number: Joi.string().trim().allow(""),
  username: Joi.string().trim().alphanum().min(3).max(30),
});

const superAdminSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required(),
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  employee_id: Joi.string().trim().required(),
  organization_id: Joi.string().trim().required(),
  phone_number: Joi.string().trim().allow(""),
  is_active: Joi.boolean().default(true),
  is_deleted: Joi.boolean().default(false),
  special_permissions: Joi.array().default([]),
  otp: Joi.string().trim().required(),
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  superAdminSchema
};
