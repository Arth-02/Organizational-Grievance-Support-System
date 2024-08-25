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
router.post("/create", checkPermission([1]), createUser);
router.get("/profile", isLoggedIn ,getUser);
router.get("/details/:id",checkPermission([4]), getUser);
router.patch("/profile/update", isLoggedIn, updateUser);
router.patch("/update/:id",checkPermission([2]), updateUser);
router.delete("/delete/:id",checkPermission([3]), deleteUser);

router.post("/create-super-admin", createSuperAdmin);
router.post("/generate-otp", sendOTPEmail);

router.post("/checkusername",checkPermission([1]) ,checkUsername);
router.post("/checkemail",checkPermission([1]) ,checkEmail);
router.post("/checkemployeeid",checkPermission([1]) ,checkEmployeeID);

module.exports = router;
