const { getMonthlyReport, getDailyReport } = require("./timeBasedReports");
const {
  getSalesPerformance,
  getProductSalesReport,
} = require("./salesReports");
const { getCustomerTransactionsReport } = require("./customerReports");
const { getIncomeExpenseReport } = require("./financialReports");
const { exportToExcel, exportToPDF } = require("./exportControllers");
const { getReportData } = require("./reportData");

module.exports = {
  getMonthlyReport,
  getDailyReport,
  getSalesPerformance,
  getProductSalesReport,
  getCustomerTransactionsReport,
  getIncomeExpenseReport,
  exportToExcel,
  exportToPDF,
  getReportData,
};
