const { createGrievance, updateGrievance, deleteGrievance, getGrievance } = require("../controllers/grievance.controller");

const router = require("express").Router();

router.post("/create", createGrievance);
router.put("/update/:id", updateGrievance);
router.delete("/delete/:id", deleteGrievance);
router.get("/get/:id", getGrievance);


module.exports = router;