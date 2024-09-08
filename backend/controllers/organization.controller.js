const Organization = require("../models/organization.model");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const {
  organizationSchema,
  updateOrganizationSchema,
} = require("../validators/organization.validator");

const createOrganization = async (req, res) => {
  try {
    const { error, value } = organizationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const {
      name,
      email,
      website,
      logo,
      description,
      city,
      state,
      country,
      pincode,
      phone,
      address,
    } = value;

    let existingOrganization = await Organization.findOne({ email });
    if (existingOrganization) {
      return errorResponse(res, 400, "Organization already exists");
    }

    const newOrganization = new Organization({
      name,
      email,
      website,
      logo,
      description,
      city,
      state,
      country,
      pincode,
      phone,
      address,
    });

    const newOrg = await newOrganization.save();
    return successResponse(
      res,
      newOrg,
      "Organization applied successfully",
      201
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { error, value } = updateOrganizationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const {
      _id,
      name,
      website,
      logo,
      description,
      city,
      state,
      country,
      pincode,
      phone,
      address,
    } = value;

    let existingOrganization = await Organization.findById(_id);
    if (!existingOrganization) {
      return errorResponse(res, 400, "Organization does not exist");
    }

    existingOrganization.name = name;
    existingOrganization.website = website;
    existingOrganization.logo = logo;
    existingOrganization.description = description;
    existingOrganization.city = city;
    existingOrganization.state = state;
    existingOrganization.country = country;
    existingOrganization.pincode = pincode;
    existingOrganization.phone = phone;
    existingOrganization.address = address;

    const updatedOrg = await existingOrganization.save();
    return successResponse(
      res,
      updatedOrg,
      "Organization updated successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

module.exports = { createOrganization, updateOrganization };
