const router = require("express").Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  getMyProjects,
  updateProject,
  deleteProject,
  addProjectMembers,
  removeProjectMembers,
  getProjectMembers,
} = require("../controllers/project.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  VIEW_PROJECT,
} = require("../utils/constant");
const upload = require("../utils/multer");

// Create a new project
router.post(
  "/create",
  checkPermission([CREATE_PROJECT.slug]),
  upload.array("icon", 1),
  createProject
);

// Get projects for sidebar/dropdown (permission-aware)
// Auth required but no specific permission - service handles permission logic
router.get(
  "/my-projects",
  isLoggedIn,
  getMyProjects
);

// Get all projects with pagination
router.get(
  "/all",
  checkPermission([VIEW_PROJECT.slug]),
  getAllProjects
);

// Get project by ID (permission check in service - allows members/managers)
router.get(
  "/details/:id",
  isLoggedIn,
  getProjectById
);

// Update a project
router.patch(
  "/update/:id",
  checkPermission([UPDATE_PROJECT.slug]),
  upload.array("icon", 1),
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

