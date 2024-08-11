const { isValidObjectId } = require("mongoose");
const Organization = require("../models/organization.model");
const { sendEmail } = require("../utils/mail");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");

const approveOrganization = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return errorResponse(res, 400, "Organization id is required");
    }

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(id, {
      is_approved: 1,
      email: 1,
    });
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }

    if (organization.is_approved) {
      return errorResponse(res, 400, "Organization already verified");
    }

    organization.is_approved = true;
    await organization.save();

    // Have to send email to organization with link to create admin account
    const isMailSend = await sendEmail(
      organization.email,
      "Organization Verified",
      `
                  <h1>Your organization has been verified</h1>
                  <p>Please click the link below to create your admin account</p>
                  <a href="${process.env.CLIENT_URL}/${organization._id}/create-admin">Create Admin Account</a>
                 `
    );

    if (!isMailSend) {
      return errorResponse(res, 500, "Failed to send email");
    }

    return successResponse(
      res,
      organization,
      "Organization verified successfully"
    );
  } catch (err) {
    console.error(err);
    return catchResponse(res);
  }
};

module.exports = {
  approveOrganization,
};
