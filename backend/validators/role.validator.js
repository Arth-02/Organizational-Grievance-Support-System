const Joi = require("joi");

export const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),
  permission_id: Joi.array().items(Joi.number()).required(),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().trim(),
  permission_id: Joi.array().items(Joi.number()),
});

export const deleteRoleSchema = Joi.object({
  replace_role_id: Joi.string().trim(),
});
