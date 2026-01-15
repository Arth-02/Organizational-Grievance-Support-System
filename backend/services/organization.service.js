const Organization = require("../models/organization.model");
const User = require("../models/user.model");
const {
  organizationSchema,
  updateOrganizationSchema,
} = require("../validators/organization.validator");
const attachmentService = require("./attachment.service");
const { isValidObjectId } = require("mongoose");
const { subscriptionService } = require("./subscription.service");

// Create Organization service
const createOrganization = async (session, body, files) => {
  try {
    const { error, value } = organizationSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
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
      selectedPlan,
      billingCycle,
    } = value;

    let existingOrganization = await Organization.findOne({ email }).session(
      session
    );
    if (existingOrganization) {
      return {
        isSuccess: false,
        message: "Organization already exists",
        code: 400,
      };
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
      // Store selected plan for use when organization is approved
      // @requirements 9.3
      selectedPlan: selectedPlan || 'starter',
      selectedBillingCycle: billingCycle || 'monthly',
    });

    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        null,
        newOrganization._id,
        files
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      newOrganization.logo_id = response.attachmentIds[0];
    }
    const newOrg = await newOrganization.save({ session });

    // Auto-assign Starter plan to new organization
    const subscriptionResult = await subscriptionService.assignStarterPlan(
      newOrg._id.toString(),
      session
    );
    if (!subscriptionResult.isSuccess) {
      console.error('Failed to assign starter plan:', subscriptionResult.message);
      // Don't fail organization creation, but log the error
    }

    return { isSuccess: true, data: newOrg };
  } catch (err) {
    console.error("Error in createOrganization service", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
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
      return { isSuccess: false, message: errors, code: 400 };
    }
    if (files && files.length > 0) {
      const response = await attachmentService.createAttachment(
        session,
        null,
        organization_id,
        files
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      value.logo_id = response.attachmentIds[0];
    }

    // Handle remove logo
    if (value.remove_logo) {
      value.logo_id = null;
      delete value.remove_logo;
    }
    const organization = await Organization.findOneAndUpdate(
      { _id: organization_id },
      value,
      {
        new: true,
      }
    ).session(session);
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }
    return { isSuccess: true, data: organization };
  } catch (err) {
    console.error("Error in updateOrganization service", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get Organization by ID service
const getOrganizationById = async (id) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Organization id is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return {
        isSuccess: false,
        message: "Invalid organization id",
        code: 400,
      };
    }
    const organization = await Organization.findOne({
      _id: id,
      is_active: true,
    }).populate("logo_id", "url filename");
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }
    return { isSuccess: true, data: organization };
  } catch (err) {
    console.error("Error in getOrganizationById service", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete Organization service (soft delete)
const deleteOrganization = async (session, organization_id) => {
  try {
    if (!organization_id) {
      return {
        isSuccess: false,
        message: "Organization id is required",
        code: 400,
      };
    }
    if (!isValidObjectId(organization_id)) {
      return {
        isSuccess: false,
        message: "Invalid organization id",
        code: 400,
      };
    }

    const organization = await Organization.findById(organization_id).session(session);
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }

    if (organization.is_deleted) {
      return { isSuccess: false, message: "Organization already deleted", code: 400 };
    }

    // Soft delete all users in the organization
    await User.updateMany(
      { organization_id },
      { is_active: false, is_deleted: true }
    ).session(session);

    // Soft delete the organization
    organization.is_active = false;
    organization.is_deleted = true;
    await organization.save({ session });

    return { isSuccess: true, message: "Organization deleted successfully" };
  } catch (err) {
    console.error("Error in deleteOrganization service", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  createOrganization,
  updateOrganization,
  getOrganizationById,
  deleteOrganization,
};
