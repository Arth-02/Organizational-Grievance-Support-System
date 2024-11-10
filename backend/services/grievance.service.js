const mongoose = require("mongoose");
const {
  createGrievanceSchema,
  updateFullGrievanceSchema,
  updateMyGrievanceSchema,
  updateAssignedGrievanceSchema,
  updateStatusGrievanceSchema,
} = require("../validators/grievance.validator");
const Grievance = require("../models/grievance.model");
const Department = require("../models/department.model");
const attachmentService = require("./attachment.service");
const LexoRank = require("./lexorank.service");
const { isValidObjectId } = require("mongoose");
const Joi = require("joi");
const userService = require("./user.service");
const { UPDATE_GRIEVANCE } = require("../utils/constant");
const { sendNotification } = require("../utils/notification");
const User = require("../models/user.model");

// Create a new grievance
const createGrievance = async (session, body, user, files) => {
  try {
    const { error, value } = createGrievanceSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const { title, description, priority, status, department_id } = value;
    const { organization_id, employee_id } = user;
    const reported_by = user._id;

    const departmentExists = await Department.findOne({
      organization_id,
      _id: department_id,
    }).session(session);
    if (!departmentExists) {
      return {
        isSuccess: false,
        message: "Department does not exist in this organization",
        code: 400,
      };
    }

    // Get the last grievance in the same status to determine rank
    const lastGrievance = await Grievance.findOne({
      organization_id,
      status,
    })
      .sort({ rank: -1 })
      .session(session);

    // Generate rank for new grievance
    const rank = lastGrievance
      ? LexoRank.generateNextRank(lastGrievance.rank)
      : LexoRank.getInitialRank();

    let newGrievance = new Grievance({
      organization_id,
      title,
      description,
      department_id,
      priority,
      status,
      reported_by,
      employee_id,
      rank,
    });
    let response;
    if (files && files.length > 0) {
      response = await attachmentService.createAttachment(
        session,
        user._id,
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
    }
    const attachmentIds = response.attachmentIds;
    newGrievance.attachments = attachmentIds;
    await newGrievance.save({ session });
    return { isSuccess: true, grievance: newGrievance };
  } catch (err) {
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a grievance
const updateGrievance = async (session, id, body, user) => {
  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Grievance ID is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }
    const { organization_id, role, _id: userId, special_permissions } = user;
    const permissions = [...role.permissions, ...special_permissions];

    const grievance = await Grievance.findOne({
      organization_id,
      _id: id,
    }).session(session);
    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    // Check permissions for various grievance updates
    const canUpdateGrievance = permissions.includes(UPDATE_GRIEVANCE.slug);
    const canUpdateMyGrievance =
      grievance.reported_by?.toString() === userId.toString();

    // Initialize schema
    let schema = Joi.object();

    // If user has full permission to update grievance
    if (canUpdateGrievance && !body.title && !body.description) {
      schema = updateFullGrievanceSchema;
      if (body.department_id && !isValidObjectId(body.department_id)) {
        return {
          isSuccess: false,
          message: "Invalid department ID",
          code: 400,
        };
      }
    } else {
      if (canUpdateMyGrievance && !body.status && !body.assigned_to) {
        schema = schema.concat(updateMyGrievanceSchema);
      }
      if (schema.describe().keys === undefined) {
        return { isSuccess: false, message: "Permission denied", code: 403 };
      }
    }

    const { error, value } = schema.validate(body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    // Prepare query to find and update grievance
    const query = { _id: id, organization_id };
    if (value.assigned_to) {
      const assigneeExists = await User.findOne({
        _id: assigned_to,
        organization_id,
      }).session(session);
      if (!assigneeExists) {
        return {
          isSuccess: false,
          message: "Assignee user not Found",
          code: 404,
        };
      }
    }

    await Grievance.updateOne(query, value, {
      new: true,
    }).session(session);

    const updatedGrievanceData = await Grievance.findOne(query)
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .session(session);

    const response = await userService.getAllUsersId(user);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const userIds = response.data.filter(
      (user) => user._id.toString() !== userId.toString()
    );

    // Send notification to all users except the one who updated the grievance
    sendNotification(userIds, {
      type: "update_grievance",
      message: `Your grievance with ID ${id} has been updated`,
      grievanceId: id,
      updatedData: updatedGrievanceData,
    });

    return { isSuccess: true, data: updatedGrievanceData };
  } catch (err) {
    console.error("Update Grievance Error:", err.stack);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a grievance Assignee
const updateGrievanceAssignee = async (session, id, body, user) => {
  try {
    const { organization_id, _id: userId } = user;
    if (!id) {
      return {
        isSuccess: false,
        message: "Grievance ID is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }

    const grievance = await Grievance.findOne({
      organization_id,
      _id: id,
    }).session(session);
    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    const { error, value } = updateAssignedGrievanceSchema.validate(body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    const query = { _id: id, organization_id };
    const { assigned_to } = value;
    const assigneeExists = await User.findOne({
      _id: assigned_to,
      organization_id,
    }).session(session);
    if (!assigneeExists) {
      return {
        isSuccess: false,
        message: "Assignee user not Found",
        code: 404,
      };
    }

    await Grievance.updateOne(query, value, {
      new: true,
    }).session(session);

    const updatedGrievanceData = await Grievance.findOne(query)
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .session(session);

    const response = await userService.getAllUsersId(user);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const userIds = response.data.filter(
      (user) => user._id.toString() !== userId.toString()
    );

    sendNotification(userIds, {
      type: "update_grievance_assignee",
      message: `Your grievance with ID ${id} has been updated`,
      grievanceId: id,
      updatedData: updatedGrievanceData,
    });

    return { isSuccess: true, data: updatedGrievanceData };
  } catch (err) {
    console.error("Update Grievance Error:", err.stack);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

// Update a grievance Status
const updateGrievanceStatus = async (session, id, body, user) => {
  try {
    const { organization_id, role, _id: userId, special_permissions } = user;
    if (!id) {
      return {
        isSuccess: false,
        message: "Grievance ID is required",
        code: 400,
      };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }

    const grievance = await Grievance.findOne({
      organization_id,
      _id: id,
    }).session(session);
    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    const permissions = [...role.permissions, ...special_permissions];

    const canUpdateGrievanceStatus =
      grievance.assigned_to?.toString() === userId.toString() ||
      permissions.includes(UPDATE_GRIEVANCE.slug);

    if (!canUpdateGrievanceStatus) {
      return { isSuccess: false, message: "Permission denied", code: 403 };
    }

    const { error, value } = updateStatusGrievanceSchema.validate(body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    let newRank = grievance.rank;
    if (value.prevRank || value.nextRank) {
      newRank = LexoRank.getMiddleRank(
        value.prevRank || null,
        value.nextRank || null
      );
    }

    // Update value object with new rank
    const updateData = {
      ...value,
      rank: newRank,
    };
    delete updateData.prevRank;
    delete updateData.nextRank;

    const query = { _id: id, organization_id };

    await Grievance.updateOne(query, value, {
      new: true,
    }).session(session);

    const updatedGrievanceData = await Grievance.findOne(query)
      .populate({ path: "department_id", select: "name" })
      .populate({ path: "reported_by", select: "username" })
      .populate({ path: "assigned_to", select: "username" })
      .session(session);

    const response = await userService.getAllUsersId(user);
    if (!response.isSuccess) {
      return {
        isSuccess: false,
        message: response.message,
        code: response.code,
      };
    }
    const userIds = response.data.filter(
      (user) => user._id.toString() !== userId.toString()
    );

    sendNotification(userIds, {
      type: "update_grievance_status",
      message: `Your grievance with ID ${id} has been updated`,
      grievanceId: id,
      updatedData: updatedGrievanceData,
    });

    return { isSuccess: true, data: updatedGrievanceData };
  } catch (err) {
    console.error("Update Grievance Error:", err.stack);
    return { isSuccess: false, message: "Internal Server Error", code: 500 };
  }
};

module.exports = {
  createGrievance,
  updateGrievance,
  updateGrievanceAssignee,
  updateGrievanceStatus,
};
