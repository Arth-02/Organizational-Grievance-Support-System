const router = require("express").Router();
const {
  createBoard,
  getBoardsByProject,
  getBoardById,
  updateBoard,
  deactivateBoard,
} = require("../controllers/board.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  UPDATE_PROJECT,
} = require("../utils/constant");

// Create a custom board for a project
router.post(
  "/create",
  checkPermission([UPDATE_PROJECT.slug]),
  createBoard
);

// Get all boards for a project
router.get(
  "/project/:projectId",
  isLoggedIn,
  getBoardsByProject
);

// Get board by ID
router.get(
  "/details/:id",
  isLoggedIn,
  getBoardById
);

// Update a board
router.patch(
  "/update/:id",
  checkPermission([UPDATE_PROJECT.slug]),
  updateBoard
);

// Deactivate a board (soft delete)
router.patch(
  "/deactivate/:id",
  checkPermission([UPDATE_PROJECT.slug]),
  deactivateBoard
);

module.exports = router;
