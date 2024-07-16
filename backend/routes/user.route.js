const router = require("express").Router();
const {
  login,
  register,
  updateProfile,
  getProfile,
} = require("../controllers/user.controller");
const { checkRole } = require("../middlewares/admin.middleware");
const { ADMIN, HR, EMPLOYEE } = require("../utils/constant");

router.get("/profile", getProfile);

router.post("/login", login);
router.post("/register", checkRole([ADMIN]), register);
router.post("/profile/update", checkRole([ADMIN, HR, EMPLOYEE]), updateProfile);

module.exports = router;
