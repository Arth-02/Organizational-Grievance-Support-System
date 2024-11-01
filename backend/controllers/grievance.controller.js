const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const Attachment = require("../models/attachment.model");
const mongoose = require("mongoose");
const uploadFiles = require("../utils/cloudinary");
const { isValidObjectId } = require("mongoose");

const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const Role = require("../models/role.model");
const {
  createGrievanceSchema,
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

// Create a grievance
// const createGrievance = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { error, value } = createGrievanceSchema.validate(req.body);
//     if (error) {
//       await session.abortTransaction();
//       return errorResponse(res, 400, error.details[0].message);
//     }

//     const { title, description, priority, status, department_id } = value;
//     const { organization_id, employee_id } = req.user;
//     const reported_by = req.user._id;

//     const departmentExists = await Department.findOne({
//       organization_id,
//       _id: department_id,
//     }).session(session);
//     if (!departmentExists) {
//       await session.abortTransaction();
//       return errorResponse(res, 400, "Invalid department");
//     }

//     let newGrievance = new Grievance({
//       organization_id,
//       title,
//       description,
//       department_id,
//       priority,
//       status,
//       reported_by,
//       employee_id,
//     });
//     let attachmentIds = [];
//     if (req.files && req.files.length > 0) {
//       for (let file of req.files) {
//         const result = await uploadFiles(file, organization_id);
//         if (!result) {
//           await session.abortTransaction();
//           return errorResponse(res, 400, "Error uploading attachments");
//         }
//         const newAttachment = new Attachment({
//           filename: file.originalname,
//           public_id: result.public_id,
//           filetype: file.mimetype,
//           filesize: file.size,
//           url: result.secure_url,
//           grievance_id: newGrievance._id,
//           organization_id,
//           uploaded_by: req.user._id,
//         });
//         const savedAttachment = await newAttachment.save({ session });
//         attachmentIds.push(savedAttachment._id);
//       }
//     }

//     newGrievance.attachments = attachmentIds;
//     await newGrievance.save({ session });
//     session.commitTransaction();
//     return successResponse(
//       res,
//       newGrievance,
//       "Grievance created successfully",
//       201
//     );
//   } catch (err) {
//     console.error("Create Grievance Error:", err);
//     await session.abortTransaction();
//     return catchResponse(res);
//   } finally {
//     session.endSession();
//   }
// };
const createGrievance = async (req, res) => {
  try {
    const result = await grievanceService.createGrievance(
      req.body,
      req.user,
      req.files
    );
    return successResponse(res, result.data, result.message, result.statusCode);
  } catch (err) {
    console.error("Create Grievance Error:", err);
    return catchResponse(res);
  }
};

// Update a grievance
const updateGrievance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (!id) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Grievance ID is required");
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return errorResponse(res, 400, "Invalid grievance ID");
    }
    const {
      organization_id,
      role,
      _id: userId,
      special_permissions,
    } = req.user;
    const permissions = [...role.permissions, ...special_permissions];

    const grievance = await Grievance.findOne({
      organization_id,
      _id: id,
    }).session(session);
    if (!grievance) {
      await session.abortTransaction();
      return errorResponse(res, 404, "Grievance not found");
    }

    // Check permissions for various grievance updates
    const canUpdateGrievance = permissions.includes(UPDATE_GRIEVANCE.slug);
    const canUpdateGrievanceStatus =
      grievance.assigned_to?.toString() === userId.toString();
    const canUpdateGrievanceAssignee = permissions.includes(
      UPDATE_GRIEVANCE_ASSIGNEE.slug
    );
    const canUpdateMyGrievance =
      grievance.reported_by?.toString() === userId.toString();

    // Initialize schema
    let schema = Joi.object();

    // If user has full permission to update grievance
    if (canUpdateGrievance) {
      schema = updateFullGrievanceSchema;
      if (req.body.department_id && !isValidObjectId(req.body.department_id)) {
        await session.abortTransaction();
        return errorResponse(res, 400, "Invalid department ID");
      }
    } else {
      if (canUpdateMyGrievance && !req.body.status && !req.body.assigned_to) {
        schema = schema.concat(updateMyGrievanceSchema);
      }
      if (canUpdateGrievanceStatus && req.body.status) {
        schema = schema.concat(updateStatusGrievanceSchema);
      }
      if (canUpdateGrievanceAssignee && req.body.assigned_to) {
        schema = schema.concat(updateAssignedGrievanceSchema);
      }

      if (schema.describe().keys === undefined) {
        await session.abortTransaction();
        return errorResponse(res, 403, "Permission denied");
      }
    }

    const { error, value } = schema.validate(req.body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      await session.abortTransaction();
      return errorResponse(res, 400, errors);
    }

    // Prepare query to find and update grievance
    const query = { _id: id, organization_id };

    const updatedGrievance = await Grievance.findOneAndUpdate(query, value, {
      new: true,
    }).session(session);
    if (!updatedGrievance) {
      await session.abortTransaction();
      return errorResponse(res, 404, "Grievance not found");
    }

    const updatedGrievanceData = await Grievance.findOne(query)
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .session(session);

    const userData = await User.find(
      { organization_id, _id: { $ne: userId } },
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

    await session.commitTransaction();
    return successResponse(
      res,
      updatedGrievance,
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
      await Attachment.updateMany(
        { _id: { $in: delete_attachments } },
        { is_active: false }
      );
      grievance.attachments = grievance.attachments.filter(
        (attachment) => !delete_attachments.includes(attachment._id.toString())
      );
    }
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await uploadFiles(file, organization_id);
        if (!result) {
          await session.abortTransaction();
          return errorResponse(res, 400, "Error uploading attachments");
        }
        const newAttachment = new Attachment({
          filename: file.originalname,
          public_id: result.public_id,
          filetype: file.mimetype,
          filesize: file.size,
          url: result.secure_url,
          grievance_id: grievance._id,
          organization_id,
          uploaded_by: req.user._id,
        });
        const savedAttachment = await newAttachment.save({ session });
        grievance.attachments.push(savedAttachment._id);
      }
    }
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
        .sort({ [sort_by]: order })
        .limit(limitNumber)
        .skip(skip)
        .populate({ path: "department_id", select: "name" })
        .populate({ path: "reported_by", select: "username" })
        .populate({ path: "assigned_to", select: "username" }),
      Grievance.countDocuments(query),
    ]);

    if (!grievances.length) {
      return errorResponse(res, 404, "No grievances found");
    }

    const totalPages = Math.ceil(totalGrievances / limitNumber);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      totalItems: totalGrievances,
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
  updateGrievanceAttachment,
  getGrievanceById,
  deleteGrievanceById,
  getAllGrievances,
};
