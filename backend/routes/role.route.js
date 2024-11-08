const {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getAllRoleName,
  getAllRoles,
  getUsersCountByRoleId,
} = require("../controllers/role.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const { VIEW_ROLE, CREATE_ROLE, UPDATE_ROLE, DELETE_ROLE } = require("../utils/constant");
const router = require("express").Router();

router.get("/details/:id", checkPermission([VIEW_ROLE.slug]), getRoleById);
router.get("/names", checkPermission([VIEW_ROLE.slug]), getAllRoleName);
router.get("/all", checkPermission([VIEW_ROLE.slug]), getAllRoles);
router.post("/create", checkPermission([CREATE_ROLE.slug]), createRole);
router.patch("/update/:id", checkPermission([UPDATE_ROLE.slug]), updateRole);
router.delete("/delete/:id", checkPermission([DELETE_ROLE.slug]), deleteRole);
router.get("/users-count/:id", isLoggedIn, getUsersCountByRoleId);

module.exports = router;
