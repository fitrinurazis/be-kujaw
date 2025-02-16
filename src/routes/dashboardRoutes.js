const express = require("express");
const { auth } = require("../middlewares/auth");
const router = express.Router();
const {
  getSummary,
  getRecentTransactions,
  getTopProducts,
  getTopCustomers,
  getSalesChart,
  getIncomeExpenseChart,
} = require("../controllers/dashboard.controller");

// Dashboard routes
router.get("/summary", auth, getSummary);
router.get("/recent-transactions", auth, getRecentTransactions);
router.get("/top-products", auth, getTopProducts);
router.get("/top-customers", auth, getTopCustomers);
router.get("/sales-chart", auth, getSalesChart);
router.get("/income-expense-chart", auth, getIncomeExpenseChart);

module.exports = router;
