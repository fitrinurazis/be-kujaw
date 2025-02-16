const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const categoryController = require("../controllers/category.controller");

const router = express.Router();

router.get("/", auth, categoryController.getAllCategories);
router.post("/", auth, adminOnly, categoryController.createCategory);
router.put("/:id", auth, adminOnly, categoryController.updateCategory);
router.delete("/:id", auth, adminOnly, categoryController.deleteCategory);

module.exports = router;
