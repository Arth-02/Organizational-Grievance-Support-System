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
} = require("../controllers/user.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");


router.post("/login", login);
router.post("/create", checkPermission(["CREATE_USER"]), createUser);
router.get("/profile", isLoggedIn ,getUser);
router.get("/details/:id",checkPermission(["VIEW_USER"]), getUser);
router.patch("/profile/update", isLoggedIn, updateUser);
router.patch("/update/:id",checkPermission(["UPDATE_USER"]), updateUser);
router.delete("/delete/:id",checkPermission(["DELETE_USER"]), deleteUser);

router.post("/create-super-admin", createSuperAdmin);
router.post("/generate-otp", sendOTPEmail);

router.post("/checkusername",checkUsername);
router.post("/checkemail",checkEmail);
router.post("/checkemployeeid" ,checkEmployeeID);

module.exports = router;
