const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const progdiController = require("../controllers/progdi.controller");

const router = express.Router();

router.get("/", auth, progdiController.getAllProgdi);
router.post("/", auth, adminOnly, progdiController.createProgdi);
router.put("/:id", auth, adminOnly, progdiController.updateProgdi);
router.delete("/:id", auth, adminOnly, progdiController.deleteProgdi);

module.exports = router;
