const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permission_id: Joi.array().items(Joi.number()).required(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim(),
  permission_id: Joi.array().items(Joi.number()),
});

const deleteRoleSchema = Joi.object({
  replace_role_id: Joi.string().trim(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema
};
