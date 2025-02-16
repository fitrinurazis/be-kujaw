const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const { upload, cleanupFiles } = require("../middlewares/fileHandler");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

router.post(
  "/",
  auth,
  upload.single("proofImage"),
  cleanupFiles,
  (req, res) => {
    transactionController.createTransaction(req, res);
  }
);
router.get("/", auth, (req, res) => {
  transactionController.getTransactions(req, res);
});

router.get("/:id", auth, (req, res) => {
  transactionController.getTransactionById(req, res);
});

router.get("/report", auth, adminOnly, (req, res) => {
  transactionController.getTransactionReport(req, res);
});

router.put(
  "/:id",
  auth,
  upload.single("proofImage"),
  cleanupFiles,
  (req, res) => {
    transactionController.updateTransaction(req, res);
  }
);

router.delete("/:id", auth, (req, res) => {
  transactionController.deleteTransaction(req, res);
});

module.exports = router;
