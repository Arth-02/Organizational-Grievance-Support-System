const { resetPermissions, createRole } = require("../controllers/role.controller");
const router = require("express").Router();

router.get("/reset-permissions", resetPermissions);
router.post("/create", createRole);

module.exports = router;