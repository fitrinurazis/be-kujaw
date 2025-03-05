const {
  Transaction,
  TransactionDetail,
  Product,
  Customer,
} = require("../../models");
const { Op } = require("sequelize");
const { generateExcelReport } = require("../../utils/exporters/excelExporter");
const { generatePDFReport } = require("../../utils/exporters/pdfExporter");
const {
  handleFileDownload,
} = require("../../utils/fileHandlers/downloadHandler");

// Monthly report function
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, format = "json" } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name"],
        },
        {
          model: TransactionDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      order: [["transactionDate", "ASC"]],
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified period",
      });
    }

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await generateExcelReport(transactions, year, month);
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await generatePDFReport(transactions, year, month);
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        const jsonData = transactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.transactionDate,
          customer: transaction.customer?.name || "Unknown Customer",
          totalAmount: transaction.totalAmount,
          details: transaction.details.map((detail) => ({
            product: detail.product?.name || "Unknown Product",
            quantity: detail.quantity,
            price: detail.pricePerUnit,
            total: detail.totalPrice,
          })),
        }));
        return res.json({
          success: true,
          data: jsonData,
          total: transactions.length,
        });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate report",
      details: error.message,
    });
  }
};

// Daily report function
const getDailyReport = async (req, res) => {
  try {
    const { date, format = "json" } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const nextDate = new Date(searchDate);
    nextDate.setDate(searchDate.getDate() + 1);

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [searchDate, nextDate],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name"],
        },
        {
          model: TransactionDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      order: [["transactionDate", "ASC"]],
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the specified date",
      });
    }

    const dailyData = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.transactionDate,
      customer: transaction.customer?.name || "Unknown Customer",
      details: transaction.details.map((detail) => ({
        product: detail.product?.name || "Unknown Product",
        quantity: detail.quantity,
        price: detail.pricePerUnit,
        total: detail.totalPrice,
      })),
      totalAmount: transaction.totalAmount,
    }));

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await generateExcelReport(
          transactions,
          searchDate.getFullYear(),
          searchDate.getMonth() + 1
        );
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await generatePDFReport(
          transactions,
          searchDate.getFullYear(),
          searchDate.getMonth() + 1
        );
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        return res.json({
          success: true,
          data: dailyData,
          total: transactions.length,
        });
    }
  } catch (error) {
    console.error("Error generating daily report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate daily report",
      details: error.message,
    });
  }
};

module.exports = {
  getMonthlyReport,
  getDailyReport,
};
