const {
  createProject,
  updateProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  updateProjectBoardTag,
  addProjectBoardTag,
  deleteProjectBoardTag,
  addProjectBoardTask,
  updateProjectBoardTask,
  deleteProjectBoardTask,
  updateProjectBoardTaskAttachment,
} = require("../controllers/project.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  CREATE_PROJECT,
  VIEW_PROJECT,
  DELETE_PROJECT,
} = require("../utils/constant");
const upload = require("../utils/multer");

const router = require("express").Router();

router.get("/all", checkPermission([VIEW_PROJECT.slug]), getAllProjects);
router.post("/create", checkPermission([CREATE_PROJECT.slug]), createProject);
router.patch("/update/:id", isLoggedIn, updateProject);
router.get("/details/:id", isLoggedIn, getProjectById);
router.delete(
  "/delete/:id",
  checkPermission([DELETE_PROJECT.slug]),
  deleteProject
);

router.post("/add-board-tag/:id", isLoggedIn, addProjectBoardTag);
router.patch("/update-board-tag/:id", isLoggedIn, updateProjectBoardTag);
router.delete("/delete-board-tag/:id", isLoggedIn, deleteProjectBoardTag);

router.post(
  "/add-board-task/:id",
  isLoggedIn,
  upload.array("attachments", 5),
  addProjectBoardTask
);
router.patch(
  "/update-board-task/:project_id/task/:task_id",
  isLoggedIn,
  updateProjectBoardTask
);
router.patch(
  "/update-board-task-attachment/:project_id/task/:task_id",
  isLoggedIn,
  upload.array("attachments", 5),
  updateProjectBoardTaskAttachment
);
router.delete(
  "/delete-board-task/:project_id/task/:task_id",
  isLoggedIn,
  deleteProjectBoardTask
);

module.exports = router;
