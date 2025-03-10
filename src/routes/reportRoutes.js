const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const reportController = require("../controllers/report.controller");

const router = express.Router();

// Laporan bulanan (dengan opsi format)
router.get("/monthly", auth, adminOnly, (req, res) => {
  // format dapat berupa 'json', 'excel', atau 'pdf'
  reportController.getMonthlyReport(req, res);
});

// Laporan harian
router.get("/daily", auth, adminOnly, (req, res) => {
  reportController.getDailyReport(req, res);
});

// Laporan kinerja penjualan
router.get("/sales-performance", auth, adminOnly, (req, res) => {
  reportController.getSalesPerformance(req, res);
});

// Laporan penjualan produk
router.get("/product-sales", auth, adminOnly, (req, res) => {
  reportController.getProductSalesReport(req, res);
});

// Laporan transaksi pelanggan
router.get("/customer-transactions", auth, adminOnly, (req, res) => {
  reportController.getCustomerTransactionsReport(req, res);
});

// Laporan pendapatan dan pengeluaran
router.get("/income-expense", auth, adminOnly, (req, res) => {
  reportController.getIncomeExpenseReport(req, res);
});

// Endpoint ekspor ke Excel
router.get("/export/excel", auth, adminOnly, (req, res) => {
  reportController.exportToExcel(req, res);
});

// Endpoint ekspor ke PDF
router.get("/export/pdf", auth, adminOnly, (req, res) => {
  reportController.exportToPDF(req, res);
});

// Endpoint untuk mendapatkan data laporan raw (untuk frontend)
router.get("/data", auth, (req, res) => {
  reportController.getReportData(req, res);
});

module.exports = router;
