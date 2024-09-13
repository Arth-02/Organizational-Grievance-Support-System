const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const uploadFiles = require("../helpers/cloudinary");
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

// Create a new organization
const createOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { error, value } = organizationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      await session.abortTransaction();
      return errorResponse(res, 400, errors);
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

    let existingOrganization = await Organization.findOne({ email }).session(session);
    if (existingOrganization) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Organization already exists");
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

    if (req.files && req.files.length > 0) {
      const result = await uploadFiles(req.files[0], newOrganization._id, true);
      if (!result) {
        await session.abortTransaction();
        return errorResponse(res, 400, "Error uploading attachments");
      }
      newOrganization.logo = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }
    const newOrg = await newOrganization.save({ session });
    await session.commitTransaction();
    return successResponse(
      res,
      newOrg,
      "Organization applied successfully",
      201
    );
  } catch (err) {
    console.error(err);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update an organization
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

// get by id
const getOrganizationById = async (req, res) => {
  try{
    const {id} = req.params;
    if(!id){
      return errorResponse(res, 400, "Organization id is required");
    }
    if(!isValidObjectId(id)){
      return errorResponse(res, 400, "Invalid organization id");
    }
    const organization = await Organization.findOne({_id:id, is_active:true});
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }
    return successResponse(res, organization, "Organization found");
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

module.exports = { createOrganization, updateOrganization, getOrganizationById };
