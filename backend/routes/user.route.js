const router = require("express").Router();
const {
  login,
  register,
  updateProfile,
  getProfile,
} = require("../controllers/user.controller");
const { checkPermission } = require("../middlewares/auth.middleware");

router.get("/profile", checkPermission([4]) ,getProfile);

router.post("/login", login);
router.post("/register", checkPermission([1]), register);
router.post("/profile/update", checkPermission([2]), updateProfile);

module.exports = router;
