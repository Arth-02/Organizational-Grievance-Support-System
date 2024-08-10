const router = require("express").Router();
const {
  login,
  createUser,
  updateUser,
  getUser,
  deleteUser,
} = require("../controllers/user.controller");
const { checkPermission, isLoggedIn, verifyOrganization } = require("../middlewares/auth.middleware");


router.post("/login", login);
router.post("/create", checkPermission([1]), verifyOrganization, createUser);
router.get("/profile", isLoggedIn ,getUser);
router.post("/profile/update", isLoggedIn, updateUser);
router.post("/update/:id",checkPermission([2]), verifyOrganization, updateUser);
router.post("/details/:id",checkPermission([4]), verifyOrganization, getUser);
router.delete("/delete/:id",checkPermission([3]), verifyOrganization, deleteUser);

module.exports = router;
