const Joi = require("joi");

export const departmentSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim(),
  is_active: Joi.boolean(),
});

export const deleteDepartmentSchema = Joi.object({
  replace_department_id: Joi.string().trim(),
});
