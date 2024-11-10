const Grievance = require("../models/grievance.model");
const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const {
  updateStatusGrievanceSchema,
  updateAssignedGrievanceSchema,
  updateFullGrievanceSchema,
  updateGrievanceAttachmentSchema,
  updateMyGrievanceSchema,
} = require("../validators/grievance.validator");
const Joi = require("joi");
const {
  UPDATE_GRIEVANCE_ASSIGNEE,
  UPDATE_GRIEVANCE,
  SUPER_ADMIN,
} = require("../utils/constant");
const { sendNotification } = require("../utils/notification");
const User = require("../models/user.model");
const grievanceService = require("../services/grievance.service");
const LexoRank = require("../services/lexorank.service");
const attachmentService = require("../services/attachment.service");
const userService = require("../services/user.service");

const createGrievance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await grievanceService.createGrievance(
      session,
      req.body,
      req.user,
      req.files
    );
    if (!result.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, 400, result.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      result.grievance,
      "Grievance created successfully",
      201
    );
  } catch (err) {
    console.error("Create Grievance Error:", err);
    await session.abortTransaction();
    return catchResponse(res);
  }
};

// Update a grievance
const updateGrievance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievance(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Error:", err.stack);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update grievance assignee
const updateGrievanceAssignee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const response = await grievanceService.updateGrievanceAssignee(
      session,
      req.params.id,
      req.body,
      req.user
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(
      res,
      response.data,
      "Grievance assignee updated successfully"
    );
  } catch (err) {
    console.error("Update Grievance Assignee Error:", err.stack);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Update grievance Status
const updateGrievanceStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const response = await grievanceService.updateGrievanceStatus(session, req.params.id, req.body, req.user);
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    return successResponse(res, response.data, "Grievance status updated successfully");
  } catch (err) {
    console.error("Update Grievance Status Error:", err.stack);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// update grievance attachment
const updateGrievanceAttachment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { organization_id, _id } = req.user;
    if (!id) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Grievance ID is required");
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Invalid grievance ID");
    }
    const { error, value } = updateGrievanceAttachmentSchema.validate(req.body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return errorResponse(res, 400, errors);
    }

    const grievance = await Grievance.findOne({
      _id: id,
      organization_id,
    }).session(session);
    if (!grievance) {
      await session.abortTransaction();
      return errorResponse(res, 404, "Grievance not found");
    }
    if (grievance.reported_by.toString() !== _id.toString()) {
      await session.abortTransaction();
      return errorResponse(res, 403, "Permission denied");
    }
    let totalAttachments = grievance?.attachments?.length;
    if (value?.delete_attachments) {
      totalAttachments -= value?.delete_attachments?.length;
    }
    if (req.files && req.files.length > 0) {
      totalAttachments += req.files?.length;
    }
    if (totalAttachments > 5) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Maximum 5 attachments allowed");
    }
    if (value?.delete_attachments && value?.delete_attachments.length > 0) {
      const { delete_attachments } = value;
      const response = await attachmentService.deleteAttachment(
        session,
        delete_attachments
      );
      if (!response.isSuccess) {
        await session.abortTransaction();
        return errorResponse(res, response.code, response.message);
      }
      grievance.attachments = grievance.attachments.filter(
        (attachment) => !delete_attachments.includes(attachment._id.toString())
      );
    }
    const response = await attachmentService.createAttachment(
      session,
      grievance._id,
      _id,
      organization_id,
      req.files
    );
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    grievance.attachments.push(...response.attachmentIds);
    const updatedGrievanceData = await Grievance.findOne({
      _id: id,
      organization_id,
    })
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .session(session);

    const userData = await User.find(
      { organization_id, _id: { $ne: _id } },
      "_id"
    );
    const userIds = userData.map((user) => user._id);

    sendNotification(
      userIds,
      {
        type: "update_grievance",
        message: `Your grievance with ID ${id} has been updated`,
        grievanceId: id,
        updatedData: updatedGrievanceData,
      },
      req.users,
      req.io
    );

    await grievance.save({ session });
    await session.commitTransaction();
    return successResponse(res, grievance, "Grievance updated successfully");
  } catch (err) {
    console.error("Update Grievance Attachment Error:", err.message);
    await session.abortTransaction();
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// get grievance by id
const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid grievance ID");
    }
    const query = { _id: id, is_active: true };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const grievance = await Grievance.findOne(query)
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .populate({
        path: "attachments",
        select: "filename url filetype filesize",
      });
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    return successResponse(res, grievance, "Grievance fetched successfully");
  } catch (err) {
    console.error("Get Grievance By Id Error:", err.message);
    return catchResponse(res);
  }
};

// delete grievance by id
const deleteGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;
    if (!id) {
      return errorResponse(res, 400, "Grievance ID is required");
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Invalid grievance ID");
    }
    const query = { _id: id };
    if (organization_id) {
      query.organization_id = organization_id;
    }
    const grievance = await Grievance.findOne(query);
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    await Grievance.updateOne({ _id: id }, { is_active: false });
    return successResponse(res, grievance, "Grievance deleted successfully");
  } catch (err) {
    console.error("Delete Grievance By Id Error:", err.message);
    return catchResponse(res);
  }
};

// get all grievances
const getAllGrievances = async (req, res) => {
  try {
    const { organization_id, role } = req.user;
    const {
      page = 1,
      limit = 10,
      sort_by = "created_at",
      order = "desc",
      search,
      status,
      priority,
      department_id,
      employee_id,
      is_active = "true",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const isSuperAdmin = role.name === SUPER_ADMIN;

    const query = { organization_id };
    if (is_active && isSuperAdmin) {
      query.is_active = is_active === "true";
    } else {
      query.is_active = true;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (department_id) {
      query.department_id = department_id;
    }
    if (employee_id) {
      query.employee_id = employee_id;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const [grievances, totalGrievances] = await Promise.all([
      Grievance.find(query)
        .sort({ rank: 1 })
        .limit(limitNumber)
        .skip(skip)
        .populate({ path: "department_id", select: "name" })
        .populate({ path: "reported_by", select: "username" })
        .populate({ path: "assigned_to", select: "username" }),
      Grievance.countDocuments(query),
    ]);

    query.status = "submitted";
    const totalSubmitted = await Grievance.countDocuments(query);
    query.status = "in-progress";
    const totalInProgress = await Grievance.countDocuments(query);
    query.status = "resolved";
    const totalResolved = await Grievance.countDocuments(query);
    query.status = "dismissed";
    const totalDismissed = await Grievance.countDocuments(query);

    if (!grievances.length) {
      return errorResponse(res, 404, "No grievances found");
    }

    const totalPages = Math.ceil(totalGrievances / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      totalItems: totalGrievances,
      totalSubmitted,
      totalInProgress,
      totalResolved,
      totalDismissed,
      totalPages: totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
    };

    return successResponse(
      res,
      { grievances, pagination },
      "Grievances fetched successfully"
    );
  } catch (err) {
    console.error("Get All Grievances Error:", err.message);
    return catchResponse(res);
  }
};
module.exports = {
  createGrievance,
  updateGrievance,
  updateGrievanceAssignee,
  updateGrievanceStatus,
  updateGrievanceAttachment,
  getGrievanceById,
  deleteGrievanceById,
  getAllGrievances,
};
