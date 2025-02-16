const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const { upload, cleanupFiles } = require("../middlewares/fileHandler");
const productController = require("../controllers/product.controller");

const router = express.Router();

router.get("/", auth, (req, res) => {
  productController.getAllProducts(req, res);
});

router.get("/:id", auth, (req, res) => {
  productController.getProductById(req, res);
});

router.post(
  "/",
  auth,
  adminOnly,
  upload.single("productImage"),
  cleanupFiles,
  (req, res) => {
    productController.createProduct(req, res);
  }
);

router.put(
  "/:id",
  auth,
  adminOnly,
  upload.single("productImage"),
  cleanupFiles,
  (req, res) => {
    productController.updateProduct(req, res);
  }
);

router.delete("/:id", auth, adminOnly, (req, res) => {
  productController.deleteProduct(req, res);
});

module.exports = router;
