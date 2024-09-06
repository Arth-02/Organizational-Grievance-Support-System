const { resetPermissions, createRole, updateRole, deleteRole, getRoleById, getAllOrganizationsRoles } = require("../controllers/role.controller");
const { checkPermission } = require("../middlewares/auth.middleware");
const router = require("express").Router();

router.get("/reset-permissions", resetPermissions);
router.get("/details/:id",checkPermission(["VIEW_ROLE"]), getRoleById);
router.post("/all",checkPermission(["VIEW_ROLE"]), getAllOrganizationsRoles);
router.post("/create",checkPermission(["CREATE_ROLE"]), createRole);
router.patch("/update/:id",checkPermission(["UPDATE_ROLE"]), updateRole);
router.delete("/delete/:id",checkPermission(["DELETE_ROLE"]), deleteRole);

module.exports = router;