const router = require("express").Router();
const {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  removeAttachment,
} = require("../controllers/task.controller");
const upload = require("../utils/multer");
const {
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  checkSubscriptionLimit,
} = require("../middlewares/subscription.middleware");

// Create a new task
router.post(
  "/create",
  isLoggedIn,
  checkSubscriptionLimit('storage'),
  upload.array("attachments", 5),
  createTask
);

// Get tasks by project with filters and pagination
router.get(
  "/project/:projectId",
  isLoggedIn,
  getTasksByProject
);

// Get task by ID
router.get(
  "/details/:id",
  isLoggedIn,
  getTaskById
);

// Update a task
router.patch(
  "/update/:id",
  isLoggedIn,
  updateTask
);

// Update task status with rank recalculation
router.patch(
  "/status/:id",
  isLoggedIn,
  updateTaskStatus
);

// Delete a task
router.delete(
  "/delete/:id",
  isLoggedIn,
  deleteTask
);

// Add a comment to a task
router.post(
  "/:id/comments",
  isLoggedIn,
  checkSubscriptionLimit('storage'),
  upload.array("attachments", 5),
  addComment
);

// Update a comment on a task
router.patch(
  "/:id/comments/:commentId",
  isLoggedIn,
  updateComment
);

// Delete a comment from a task
router.delete(
  "/:id/comments/:commentId",
  isLoggedIn,
  deleteComment
);

// Add attachments to a task
router.post(
  "/:id/attachments",
  isLoggedIn,
  checkSubscriptionLimit('storage'),
  upload.array("attachments", 5),
  addAttachment
);

// Remove an attachment from a task
router.delete(
  "/:id/attachments/:attachmentId",
  isLoggedIn,
  removeAttachment
);

module.exports = router;
