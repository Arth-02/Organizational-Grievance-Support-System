const Joi = require("joi");

const departmentSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim(),
  is_active: Joi.boolean(),
});

const deleteDepartmentSchema = Joi.object({
  replace_department_id: Joi.string().trim(),
});

module.exports = {
  departmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema
};
