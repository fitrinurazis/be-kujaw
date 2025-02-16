const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const { upload, cleanupFiles } = require("../middlewares/fileHandler");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", auth, (req, res) => {
  userController.getProfile(req, res);
});
router.put(
  "/profile",
  auth,
  upload.single("avatar"),
  cleanupFiles,
  (req, res) => {
    userController.updateProfile(req, res);
  }
);

router.get("/sales", auth, adminOnly, (req, res) => {
  userController.getAllSales(req, res);
});

router.post("/sales", auth, adminOnly, (req, res) => {
  userController.createSalesUser(req, res);
});

router.put("/sales/:id", auth, adminOnly, (req, res) => {
  userController.updateSalesUser(req, res);
});

router.delete("/sales/:id", auth, adminOnly, (req, res) => {
  userController.deleteSalesUser(req, res);
});

module.exports = router;
