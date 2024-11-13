const Task = require("../models/task.model");
const {
  updateTaskSchema,
  updateTaskAttachmentchema,
  updateTaskSubmissionSchema,
  updateTaskFinishSchema,
} = require("../validators/task.validator");
const attachmentService = require("./attachment.service");
const { isValidObjectId } = require("mongoose");

// Create a Task service
const createTask = async (session, body, user, files) => {
  try {
    let response;
    if (files && files.length > 0) {
      response = await attachmentService.createAttachment(
        session,
        user._id,
        user._organization_id,
        files
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      const attachmentIds = response.attachmentIds;
      body.attachments = attachmentIds;
    }
    const newTask = new Task({
      ...body,
      created_by: user._id,
    });
    const task = await newTask.save({ session: session });
    return {
      isSuccess: true,
      message: "Task created successfully",
      task_id: task._id,
      code: 201,
    };
  } catch (error) {
    console.log("Create Task Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update a Task service
const updateTask = async (session, id, body) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Task ID", code: 400 };
    }
    const task = await Task.findById(id).session(session);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    const { error, value } = updateTaskSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { ...value },
      { new: true }
    ).session(session);
    return {
      isSuccess: true,
      message: "Task updated successfully",
      data: updatedTask,
      code: 200,
    };
  } catch (error) {
    console.log("Update Task Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update a Task Attachment service
const updateTaskAttachment = async (session, id, body, user, files) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Task ID", code: 400 };
    }
    const task = await Task.findById(id).session(session);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    const { error, value } = updateTaskAttachmentchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }

    let totalAttachments = task.attachments.length;
    if (files && files.length > 0) {
      totalAttachments += files.length;
    }
    if (value.delete_attachments && value.delete_attachments.length > 0) {
      totalAttachments -= value.delete_attachments.length;
    }
    if (totalAttachments > 5) {
      return {
        isSuccess: false,
        message: "Maximum 5 attachments allowed",
        code: 400,
      };
    }
    if (value.delete_attachments && value.delete_attachments.length > 0) {
      const deleteAttachments = value.delete_attachments;
      const response = await attachmentService.deleteAttachment(
        session,
        deleteAttachments
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      task.attachments = task.attachments.filter(
        (attachment) => !deleteAttachments.includes(attachment.toString())
      );
    }
    let response;
    if (files && files.length > 0) {
      response = await attachmentService.createAttachment(
        session,
        user._id,
        user.organization_id,
        files
      );
      if (!response.isSuccess) {
        return {
          isSuccess: false,
          message: response.message,
          code: response.code,
        };
      }
      const attachmentIds = response.attachmentIds;
      task.attachments = task.attachments.concat(attachmentIds);
    }
    const updatedTask = await task.save({ session: session });
    return {
      isSuccess: true,
      message: "Task attachment updated successfully",
      data: updatedTask,
      code: 200,
    };
  } catch (error) {
    console.log("Update Task Attachment Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update Task Submit service
const updateTaskSubmission = async (session, id, body,user ,isProjectManager) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Task ID", code: 400 };
    }
    const task = await Task.findById(id).session(session);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    if (
      !isProjectManager &&
      task.assignee_to.toString() !== user._id.toString()
    ) {
      return {
        isSuccess: false,
        message: "Permission denied",
        code: 403,
      };
    }
    const { error, value } = updateTaskSubmissionSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    task.is_submitted = value.is_submitted;
    const updatedTask = await task.save({ session: session });
    return {
      isSuccess: true,
      message: "Task submitted successfully",
      data: updatedTask,
      code: 200,
    };
  } catch (error) {
    console.log("Update Task Submit Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update Task Finish service
const updateTaskFinish = async (session, id, body) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Task ID", code: 400 };
    }
    const task = await Task.findById(id).session(session);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    const { error, value } = updateTaskFinishSchema.validate(body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return { isSuccess: false, message: errors, code: 400 };
    }
    task.is_finished = value.is_finished;
    const updatedTask = await task.save({ session: session });
    return {
      isSuccess: true,
      message: "Task finished successfully",
      data: updatedTask,
      code: 200,
    };
  } catch (error) {
    console.log("Update Task Finish Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete Task service
const deleteTask = async (session, id) => {
  try {
    if (!id) {
      return { isSuccess: false, message: "Task ID is required", code: 400 };
    }
    if (!isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid Task ID", code: 400 };
    }
    const task = await Task.findByIdAndDelete(id).session(session);
    if (!task) {
      return { isSuccess: false, message: "Task not found", code: 404 };
    }
    return {
      isSuccess: true,
      message: "Task deleted successfully",
    };
  } catch (error) {
    console.log("Delete Task Error: ", error);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  createTask,
  updateTask,
  updateTaskAttachment,
  updateTaskSubmission,
  updateTaskFinish,
  deleteTask,
};
