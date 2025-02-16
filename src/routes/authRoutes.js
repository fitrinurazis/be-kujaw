const express = require("express");
const { auth } = require("../middlewares/auth");
const authController = require("../controllers/auth.controller");
const { upload } = require("../middlewares/fileHandler");

const router = express.Router();

router.post("/register", upload.single("avatar"), authController.register);
router.post("/login", authController.login);
router.get("/profile", auth, authController.getProfile);
router.post("/change-password", auth, authController.changePassword);
router.post("/logout", auth, authController.logout);

module.exports = router;
