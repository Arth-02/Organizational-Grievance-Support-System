const router = require("express").Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMembers,
  removeProjectMembers,
  getProjectMembers,
} = require("../controllers/project.controller");
const {
  checkPermission,
} = require("../middlewares/auth.middleware");
const {
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  VIEW_PROJECT,
} = require("../utils/constant");

// Create a new project
router.post(
  "/create",
  checkPermission([CREATE_PROJECT.slug]),
  createProject
);

// Get all projects with pagination
router.get(
  "/all",
  checkPermission([VIEW_PROJECT.slug]),
  getAllProjects
);

// Get project by ID
router.get(
  "/details/:id",
  checkPermission([VIEW_PROJECT.slug]),
  getProjectById
);

// Update a project
router.patch(
  "/update/:id",
  checkPermission([UPDATE_PROJECT.slug]),
  updateProject
);

// Delete a project (soft delete)
router.delete(
  "/delete/:id",
  checkPermission([DELETE_PROJECT.slug]),
  deleteProject
);

// Add members/managers to a project
router.post(
  "/:id/members",
  checkPermission([UPDATE_PROJECT.slug]),
  addProjectMembers
);

// Remove members/managers from a project
router.delete(
  "/:id/members",
  checkPermission([UPDATE_PROJECT.slug]),
  removeProjectMembers
);

// Get project members and managers
router.get(
  "/:id/members",
  checkPermission([VIEW_PROJECT.slug]),
  getProjectMembers
);

module.exports = router;
