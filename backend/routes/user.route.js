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
  getUserNames,
  changePassword,
  changeEmail,
} = require("../controllers/user.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  checkSubscriptionLimit,
} = require("../middlewares/subscription.middleware");
const {
  CREATE_USER,
  VIEW_USER,
  UPDATE_USER,
  DELETE_USER,
} = require("../utils/constant");
const upload = require("../utils/multer");

router.post("/login", login);
router.post(
  "/create",
  checkPermission([CREATE_USER.slug]),
  checkSubscriptionLimit('users'),
  upload.array("avatar", 1),
  createUser
);
router.get("/profile", isLoggedIn, getUser);
router.get("/details/:id", checkPermission([VIEW_USER.slug]), getUser);
router.get("/all", checkPermission([VIEW_USER.slug]), getAllUsers);
router.patch(
  "/profile/update",
  isLoggedIn,
  upload.array("avatar", 1),
  updateUser
);
router.patch("/profile/change-password", isLoggedIn, changePassword);
router.patch("/profile/change-email", isLoggedIn, changeEmail);
router.patch("/update/:id", checkPermission([UPDATE_USER.slug]), updateUser);
router.delete("/delete/:id", checkPermission([DELETE_USER.slug]), deleteUser);
router.delete("/delete", checkPermission([DELETE_USER.slug]), deleteAllUsers);

router.post("/create-super-admin", createSuperAdmin);
router.post("/generate-otp", sendOTPEmail);

router.post("/checkusername", checkUsername);
router.post("/checkemail", checkEmail);
router.post("/checkemployeeid", checkEmployeeID);

router.get("/usersid", checkPermission([VIEW_USER.slug]), getAllUsersId);
router.get("/usersname", isLoggedIn, getUserNames);

router.get("/permissions", isLoggedIn, getAllPermissions);

module.exports = router;

