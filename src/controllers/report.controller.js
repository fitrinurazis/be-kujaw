// Import semua controller laporan
const { getReportData } = require("./reports/reportData");
const { exportToExcel, exportToPDF } = require("./reports/exportControllers");

// Dummy functions untuk rute yang belum diimplementasikan
const getMonthlyReport = (req, res) => {
  const { format = "json" } = req.query;

  if (format === "excel") {
    return exportToExcel(req, res);
  } else if (format === "pdf") {
    return exportToPDF(req, res);
  } else {
    // Default to JSON format
    return getReportData(req, res);
  }
};

const getDailyReport = (req, res) => {
  return getReportData(req, res);
};

const getSalesPerformance = (req, res) => {
  req.query.reportType = "sales";
  return getReportData(req, res);
};

const getProductSalesReport = (req, res) => {
  req.query.reportType = "products";
  return getReportData(req, res);
};

const getCustomerTransactionsReport = (req, res) => {
  req.query.reportType = "customers";
  return getReportData(req, res);
};

const getIncomeExpenseReport = (req, res) => {
  req.query.reportType = "income-expense";
  return getReportData(req, res);
};

module.exports = {
  getReportData,
  exportToExcel,
  exportToPDF,
  getMonthlyReport,
  getDailyReport,
  getSalesPerformance,
  getProductSalesReport,
  getCustomerTransactionsReport,
  getIncomeExpenseReport,
};
