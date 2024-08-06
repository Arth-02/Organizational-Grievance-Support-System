const router = require("express").Router();
const {
  login,
  register,
  updateProfile,
  getProfile,
} = require("../controllers/user.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");


router.post("/login", login);
router.post("/register", checkPermission([1]), register);
router.get("/profile", isLoggedIn ,getProfile);
router.post("/profile/update", isLoggedIn, updateProfile);

module.exports = router;
