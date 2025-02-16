const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const classController = require("../controllers/class.controller");

const router = express.Router();

router.get("/", auth, classController.getAllClass);
router.post("/", auth, adminOnly, classController.createClass);
router.put("/:id", auth, adminOnly, classController.updateClass);
router.delete("/:id", auth, adminOnly, classController.deleteClass);

module.exports = router;
