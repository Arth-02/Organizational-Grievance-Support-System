const Organization = require("../models/organization.model");
const {
  organizationSchema,
  updateOrganizationSchema,
} = require("../validators/organization.validator");
const attachmentService = require("./attachment.service");
const { isValidObjectId } = require("mongoose");

// Create Organization service
const createOrganization = async (session, body, files) => {
  try {
    const { error, value } = organizationSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }

    const {
      name,
      email,
      website,
      description,
      city,
      state,
      country,
      pincode,
      phone,
      address,
    } = value;

    let existingOrganization = await Organization.findOne({ email }).session(
      session
    );
    if (existingOrganization) {
      return { isSuccess: false, message: "Organization already exists" };
    }

    const newOrganization = new Organization({
      name,
      email,
      website,
      description,
      city,
      state,
      country,
      pincode,
      phone,
      address,
    });

    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        null,
        newOrganization._id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      newOrg.logo_id = response.attachmentIds[0];
    }
    const newOrg = await newOrganization.save({ session });
    return { isSuccess: true, data: newOrg };
  } catch (err) {
    console.error("Error in createOrganization service", err);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Update Organization service
const updateOrganization = async (session, body, userData, files) => {
  try {
    const { organization_id } = userData;
    const { error, value } = updateOrganizationSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors };
    }
    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        null,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return { isSuccess: false, message: response.message };
      }
      value.logo_id = response.attachmentIds[0];
    }
    const organization = await Organization.findOneAndUpdate(
      { _id: organization_id },
      value,
      {
        new: true,
      }
    ).session(session);
    if (!organization) {
      return { isSuccess: false, message: "Organization not found" };
    }
    return { isSuccess: true, data: organization };
  } catch (err) {
    console.error("Error in updateOrganization service", err);
    return { isSuccess: false, message: "Internal server error" };
  }
};

// Get Organization by ID service
const getOrganizationById = async (id) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Organization id is required" };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid organization id" };
    }
    const organization = await Organization.findOne({
      _id: id,
      is_active: true,
    });
    if (!organization) {
      return { isSuccess: false, message: "Organization not found" };
    }
    return { isSuccess: true, data: organization };
  } catch (err) {
    console.error("Error in getOrganizationById service", err);
    return { isSuccess: false, message: "Internal server error" };
  }
};

module.exports = {
  createOrganization,
  updateOrganization,
  getOrganizationById,
};
