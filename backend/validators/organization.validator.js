const Joi = require("joi");

const organizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  website: Joi.string().trim().required(),
  logo: Joi.string().trim().allow(""),
  description: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  pincode: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
});

const updateOrganizationSchema = Joi.object({
  _id: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  website: Joi.string().trim().required(),
  logo: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  pincode: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
});

module.exports = {
  organizationSchema,
  updateOrganizationSchema
};
