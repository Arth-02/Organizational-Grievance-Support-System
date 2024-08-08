const router = require("express").Router();
const {
  login,
  createUser,
  updateProfile,
  getProfile,
} = require("../controllers/user.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");


router.post("/login", login);
router.post("/create", checkPermission([1]), createUser);
router.get("/profile", isLoggedIn ,getProfile);
router.post("/profile/update", isLoggedIn, updateProfile);

module.exports = router;
