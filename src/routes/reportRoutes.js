const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const reportController = require("../controllers/report.controller");

const router = express.Router();

// Add format parameter documentation in comments
router.get("/monthly", auth, adminOnly, (req, res) => {
  // format can be 'json', 'excel', or 'pdf'
  reportController.getMonthlyReport(req, res);
});

router.get("/daily", auth, adminOnly, (req, res) => {
  reportController.getDailyReport(req, res);
});

router.get("/sales-performance", auth, adminOnly, (req, res) => {
  reportController.getSalesPerformance(req, res);
});

router.get("/product-sales", auth, adminOnly, (req, res) => {
  reportController.getProductSalesReport(req, res);
});

router.get("/customer-transactions", auth, adminOnly, (req, res) => {
  reportController.getCustomerTransactionsReport(req, res);
});

router.get("/income-expense", auth, adminOnly, (req, res) => {
  reportController.getIncomeExpenseReport(req, res);
});

router.get("/export/excel", auth, adminOnly, (req, res) => {
  reportController.exportToExcel(req, res);
});

router.get("/export/pdf", auth, adminOnly, (req, res) => {
  reportController.exportToPDF(req, res);
});

module.exports = router;
