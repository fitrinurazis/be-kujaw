const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const { upload, cleanupFiles } = require("../middlewares/fileHandler");
const {
  createIncomeTransaction,
  createExpenseTransaction,
  updateIncomeTransaction,
  updateExpenseTransaction,
  updateTransactionDetailStatus,
  deleteIncomeTransaction,
  deleteExpenseTransaction,
  getTransactions,
  getTransactionById,
} = require("../controllers/transaction.controller");

const router = express.Router();

// Income routes
router.post(
  "/income",
  auth,
  adminOnly,
  upload.single("proofImage"),
  cleanupFiles,
  createIncomeTransaction
);
router.put(
  "/income/:id",
  auth,
  adminOnly,
  upload.single("proofImage"),
  cleanupFiles,
  updateIncomeTransaction
);
router.delete("/income/:id", auth, deleteIncomeTransaction);

// Expense routes
router.post(
  "/expense",
  auth,
  adminOnly,
  upload.single("proofImage"),
  cleanupFiles,
  createExpenseTransaction
);
router.put(
  "/expense/:id",
  auth,
  adminOnly,
  upload.single("proofImage"),
  cleanupFiles,
  updateExpenseTransaction
);

router.patch(
  "/detail/:detailId/status",
  auth,
  adminOnly,
  updateTransactionDetailStatus
);

router.delete("/expense/:id", auth, adminOnly, deleteExpenseTransaction);

// General routes
router.get("/", auth, getTransactions);
router.get("/:id", auth, getTransactionById);

module.exports = router;
