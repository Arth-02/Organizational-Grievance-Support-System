const { isValidObjectId } = require("mongoose");
const Organization = require("../models/organization.model");
const { sendEmail } = require("../utils/mail");
const auditService = require("../services/audit.service");
const { subscriptionService } = require("../services/subscription.service");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");

const approveOrganization = async (req, res) => {
  try {
    // Support both body.id (legacy) and params.id (new)
    const id = req.params.id || req.body.id;
    if (!id) {
      return errorResponse(res, 400, "Organization id is required");
    }

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid organization id");
    }

    const organization = await Organization.findById(id, {
      is_approved: 1,
      email: 1,
      name: 1,
      selectedPlan: 1,
      selectedBillingCycle: 1,
    });
    if (!organization) {
      return errorResponse(res, 404, "Organization not found");
    }

    if (organization.is_approved) {
      return errorResponse(res, 400, "Organization already verified");
    }

    organization.is_approved = true;
    await organization.save();

    // Assign the selected plan to newly approved organization
    // @requirements 9.3
    const selectedPlan = organization.selectedPlan || 'starter';
    const selectedBillingCycle = organization.selectedBillingCycle || 'monthly';
    
    const subscriptionResult = await subscriptionService.assignSelectedPlan(
      id,
      selectedPlan,
      selectedBillingCycle
    );
    if (!subscriptionResult.isSuccess) {
      console.error('Failed to assign selected plan on approval:', subscriptionResult.message);
      // Don't fail the approval, but log the error
    }

    // Log audit
    await auditService.logOrganizationAction(
      "ORGANIZATION_APPROVED",
      organization,
      req
    );

    // Customize email message based on selected plan
    let planMessage = '';
    if (selectedPlan === 'professional') {
      planMessage = '<p>Your 14-day free trial of the Professional plan has started!</p>';
    } else if (selectedPlan === 'enterprise') {
      planMessage = '<p>You selected the Enterprise plan. Our sales team will contact you shortly to set up your custom plan.</p>';
    }

    const isMailSend = await sendEmail(
      organization.email,
      "Organization Verified",
      `
                  <h1>Your organization has been verified</h1>
                  ${planMessage}
                  <p>Please click the link below to create your admin account</p>
                  <a href="${process.env.CLIENT_URL}/organization/super-admin/create?id=${organization._id}">Create Admin Account</a>
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
