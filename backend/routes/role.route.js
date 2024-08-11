const { resetPermissions, createRole, updateRole, deleteRole, getRoleById, getAllOrganizationsRoles } = require("../controllers/role.controller");
const { checkPermission } = require("../middlewares/auth.middleware");
const router = require("express").Router();

router.get("/reset-permissions", resetPermissions);
router.post("/details/:id",checkPermission([16]), getRoleById);
router.post("/all",checkPermission([16]), getAllOrganizationsRoles);
router.post("/create",checkPermission([13]), createRole);
router.patch("/update/:id",checkPermission([14]), updateRole);
router.delete("/delete/:id",checkPermission([15]), deleteRole);

module.exports = router;