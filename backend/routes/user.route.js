const router = require("express").Router();
const {
  login,
  createUser,
  updateUser,
  getUser,
  deleteUser,
  createSuperAdmin,
  sendOTPEmail,
} = require("../controllers/user.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");


router.post("/login", login);
router.post("/create", checkPermission([1]), createUser);
router.get("/profile", isLoggedIn ,getUser);
router.post("/details/:id",checkPermission([4]), getUser);
router.patch("/profile/update", isLoggedIn, updateUser);
router.patch("/update/:id",checkPermission([2]), updateUser);
router.delete("/delete/:id",checkPermission([3]), deleteUser);

router.post("/create-super-admin", createSuperAdmin);
router.post("/generate-otp", sendOTPEmail);

module.exports = router;
