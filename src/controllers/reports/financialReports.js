const { Transaction } = require("../../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const {
  handleFileDownload,
} = require("../../utils/fileHandlers/downloadHandler");

const getIncomeExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Check if the dates provided are valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Make sure end date includes the full day
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [start, end],
        },
      },
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified period",
      });
    }

    const report = transactions.reduce(
      (acc, transaction) => {
        // Use "pemasukan" and "pengeluaran" instead of "INCOME" and "EXPENSE"
        if (transaction.type === "pemasukan") {
          acc.totalIncome += parseFloat(transaction.totalAmount || 0);
        } else if (transaction.type === "pengeluaran") {
          acc.totalExpense += parseFloat(transaction.totalAmount || 0);
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, netIncome: 0 }
    );

    report.netIncome = report.totalIncome - report.totalExpense;

    const reportData = {
      period: `${startDate} to ${endDate}`,
      totalIncome: report.totalIncome.toFixed(2),
      totalExpense: report.totalExpense.toFixed(2),
      netIncome: report.netIncome.toFixed(2),
    };

    switch (format.toLowerCase()) {
      case "excel": {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Income Expense Summary");

        worksheet.columns = [
          { header: "Period", key: "period", width: 30 },
          { header: "Total Income", key: "totalIncome", width: 15 },
          { header: "Total Expense", key: "totalExpense", width: 15 },
          { header: "Net Income", key: "netIncome", width: 15 },
        ];

        worksheet.addRow(reportData);

        const tempFilePath = `income-expense-${startDate}-to-${endDate}.xlsx`;
        await workbook.xlsx.writeFile(tempFilePath);

        return await handleFileDownload(tempFilePath, res);
      }
      case "pdf": {
        const tempFilePath = `income-expense-${startDate}-to-${endDate}.pdf`;
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(tempFilePath);

        doc.pipe(stream);

        doc.fontSize(16).text(`Income Expense Report`, {
          align: "center",
        });
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, {
          align: "center",
        });
        doc.moveDown();

        doc.fontSize(12).text(`Total Income: ${reportData.totalIncome}`);
        doc.text(`Total Expense: ${reportData.totalExpense}`);
        doc.text(`Net Income: ${reportData.netIncome}`);

        doc.end();

        return new Promise((resolve, reject) => {
          stream.on("finish", () => {
            handleFileDownload(tempFilePath, res);
            resolve();
          });
          stream.on("error", reject);
        });
      }
      case "json":
      default:
        return res.json(reportData);
    }
  } catch (error) {
    console.error("Error generating income/expense report:", error);
    return res.status(500).json({
      error: "Failed to generate income/expense report",
      details: error.message,
    });
  }
};
module.exports = {
  getIncomeExpenseReport,
};
