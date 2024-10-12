const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permissions: Joi.array().items(Joi.string()).required(),
  is_active: Joi.boolean().default(true),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim(),
  permissions: Joi.array().items(Joi.string()),
  is_active: Joi.boolean(),
});

const deleteRoleSchema = Joi.object({
  replace_role_id: Joi.string().trim(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
};
