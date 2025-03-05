const { Transaction, Customer } = require("../../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const {
  handleFileDownload,
} = require("../../utils/fileHandlers/downloadHandler");

const getCustomerTransactionsReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const transactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      include: [
        {
          model: Customer,
          as: "customer",
        },
      ],
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified period",
      });
    }

    const customerTransactions = transactions.reduce((acc, transaction) => {
      if (!transaction.customer) return acc;

      const customerId = transaction.customer.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerName: transaction.customer.name || "Unknown Customer",
          totalSpent: 0,
          transactionCount: 0,
        };
      }
      acc[customerId].totalSpent += parseFloat(transaction.totalAmount || 0);
      acc[customerId].transactionCount += 1;
      return acc;
    }, {});

    const customerData = Object.values(customerTransactions);

    switch (format.toLowerCase()) {
      case "excel": {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Customer Transactions");

        worksheet.columns = [
          { header: "Customer Name", key: "customerName", width: 30 },
          { header: "Total Spent", key: "totalSpent", width: 15 },
          { header: "Transaction Count", key: "transactionCount", width: 20 },
        ];

        customerData.forEach((item) => {
          worksheet.addRow(item);
        });

        const tempFilePath = `customer-transactions-${startDate}-to-${endDate}.xlsx`;
        await workbook.xlsx.writeFile(tempFilePath);

        return await handleFileDownload(tempFilePath, res);
      }
      case "pdf": {
        const tempFilePath = `customer-transactions-${startDate}-to-${endDate}.pdf`;
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(tempFilePath);

        doc.pipe(stream);

        doc.fontSize(16).text(`Customer Transactions Report`, {
          align: "center",
        });
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, {
          align: "center",
        });
        doc.moveDown();

        customerData.forEach((item) => {
          doc.fontSize(12).text(`Customer: ${item.customerName}`);
          doc.fontSize(10).text(`Total Spent: ${item.totalSpent.toFixed(2)}`);
          doc.text(`Transaction Count: ${item.transactionCount}`);
          doc.moveDown();
        });

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
        return res.json(customerData);
    }
  } catch (error) {
    console.error("Error generating customer transactions report:", error);
    return res.status(500).json({
      error: "Failed to generate customer transactions report",
      details: error.message,
    });
  }
};

module.exports = {
  getCustomerTransactionsReport,
};
