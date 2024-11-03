const router = require("express").Router();
const {
  login,
  createUser,
  updateUser,
  getUser,
  deleteUser,
  createSuperAdmin,
  sendOTPEmail,
  checkUsername,
  checkEmail,
  checkEmployeeID,
  getAllUsers,
  deleteAllUsers,
  getAllPermissions,
  getAllUsersId,
  addBoard,
  addBoardTag,
  updateBoardTag,
  deleteBoardTag,
  deleteBoard,
  addBoardTask,
  updateBoardTask,
  deleteBoardTask,
} = require("../controllers/user.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  CREATE_USER,
  VIEW_USER,
  UPDATE_USER,
  DELETE_USER,
} = require("../utils/constant");
const upload = require("../utils/multer");

router.post("/login", login);
router.post("/create", checkPermission([CREATE_USER.slug]), createUser);
router.get("/profile", isLoggedIn, getUser);
router.get("/details/:id", checkPermission([VIEW_USER.slug]), getUser);
router.get("/all", checkPermission([VIEW_USER.slug]), getAllUsers);
router.patch("/profile/update", isLoggedIn, updateUser);
router.patch("/update/:id", checkPermission([UPDATE_USER.slug]), updateUser);
router.delete("/delete/:id", checkPermission([DELETE_USER.slug]), deleteUser);
router.delete("/delete", checkPermission([DELETE_USER.slug]), deleteAllUsers);

router.post("/create-super-admin", createSuperAdmin);
router.post("/generate-otp", sendOTPEmail);

router.post("/checkusername", checkUsername);
router.post("/checkemail", checkEmail);
router.post("/checkemployeeid", checkEmployeeID);
router.get("/usersid", checkPermission([VIEW_USER.slug]), getAllUsersId);

router.get("/permissions", isLoggedIn, getAllPermissions);

router.post("/add-board", isLoggedIn, addBoard);
router.delete("/delete-board/:id", isLoggedIn, deleteBoard);

router.post("/add-board-tag/:id", isLoggedIn, addBoardTag);
router.patch("/update-board-tag/:id", isLoggedIn, updateBoardTag);
router.delete("/delete-board-tag/:id", isLoggedIn, deleteBoardTag);

router.post(
  "/add-board-task/:id",
  isLoggedIn,
  upload.array("attachments", 5),
  addBoardTask
);
router.patch(
  "/update-board-task/:board_id/task/:task_id",
  isLoggedIn,
  updateBoardTask
);
router.delete(
  "/delete-board-task/:board_id/task/:task_id",
  isLoggedIn,
  deleteBoardTask
);

module.exports = router;
