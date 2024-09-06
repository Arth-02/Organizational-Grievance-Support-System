const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permissions: Joi.array().items(Joi.string()).required(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim(),
  permissions: Joi.array().items(Joi.string()),
});

const deleteRoleSchema = Joi.object({
  replace_role_id: Joi.string().trim(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema
};
