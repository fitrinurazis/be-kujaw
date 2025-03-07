const {
  Transaction,
  User,
  Customer,
  TransactionDetail,
  Product,
} = require("../../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const {
  handleFileDownload,
} = require("../../utils/fileHandlers/downloadHandler");

// Sales performance report
const getSalesPerformance = async (req, res) => {
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
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified period",
      });
    }

    const salesPerformance = transactions.reduce((acc, transaction) => {
      if (!transaction.user) return acc;

      const userId = transaction.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          name: transaction.user.name,
          totalSales: 0,
          transactionCount: 0,
        };
      }
      acc[userId].totalSales += parseFloat(transaction.totalAmount || 0);
      acc[userId].transactionCount += 1;
      return acc;
    }, {});

    const salesData = Object.values(salesPerformance);

    switch (format.toLowerCase()) {
      case "excel": {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Performance");

        worksheet.columns = [
          { header: "Name", key: "name", width: 20 },
          { header: "Total Sales", key: "totalSales", width: 15 },
          { header: "Transaction Count", key: "transactionCount", width: 15 },
        ];

        salesData.forEach((item) => {
          worksheet.addRow(item);
        });

        const tempFilePath = `sales-performance-${startDate}-to-${endDate}.xlsx`;
        await workbook.xlsx.writeFile(tempFilePath);

        return await handleFileDownload(tempFilePath, res);
      }
      case "pdf": {
        const tempFilePath = `sales-performance-${startDate}-to-${endDate}.pdf`;
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(tempFilePath);

        doc.pipe(stream);

        doc.fontSize(16).text(`Sales Performance Report`, {
          align: "center",
        });
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, {
          align: "center",
        });
        doc.moveDown();

        salesData.forEach((item) => {
          doc.fontSize(12).text(`Name: ${item.name}`);
          doc.fontSize(10).text(`Total Sales: ${item.totalSales.toFixed(2)}`);
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
        return res.json(salesData);
    }
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate sales performance report",
      details: error.message,
    });
  }
};

// Product sales report
const getProductSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const transactionDetails = await TransactionDetail.findAll({
      include: [
        {
          model: Transaction,
          as: "transaction",
          where: {
            transactionDate: {
              [Op.between]: [new Date(startDate), new Date(endDate)],
            },
          },
        },
        {
          model: Product,
          as: "product",
        },
      ],
    });

    if (transactionDetails.length === 0) {
      return res.status(404).json({
        message: "No product sales found for the specified period",
      });
    }

    const productSales = transactionDetails.reduce((acc, detail) => {
      if (!detail.product) return acc;

      const productId = detail.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          productName: detail.product.name,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[productId].totalQuantity += detail.quantity || 0;
      acc[productId].totalRevenue += parseFloat(detail.totalPrice || 0);
      return acc;
    }, {});

    const productSalesData = Object.values(productSales);

    switch (format.toLowerCase()) {
      case "excel": {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Product Sales");

        worksheet.columns = [
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Total Quantity", key: "totalQuantity", width: 15 },
          { header: "Total Revenue", key: "totalRevenue", width: 20 },
        ];

        productSalesData.forEach((item) => {
          worksheet.addRow(item);
        });

        const tempFilePath = `product-sales-${startDate}-to-${endDate}.xlsx`;
        await workbook.xlsx.writeFile(tempFilePath);

        return await handleFileDownload(tempFilePath, res);
      }
      case "pdf": {
        const tempFilePath = `product-sales-${startDate}-to-${endDate}.pdf`;
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(tempFilePath);

        doc.pipe(stream);

        doc.fontSize(16).text(`Product Sales Report`, {
          align: "center",
        });
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, {
          align: "center",
        });
        doc.moveDown();

        productSalesData.forEach((item) => {
          doc.fontSize(12).text(`Product: ${item.productName}`);
          doc.fontSize(10).text(`Total Quantity: ${item.totalQuantity}`);
          doc.text(`Total Revenue: ${item.totalRevenue.toFixed(2)}`);
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
        return res.json(productSalesData);
    }
  } catch (error) {
    console.error("Error generating product sales report:", error);
    return res.status(500).json({
      error: "Failed to generate product sales report",
      details: error.message,
    });
  }
};

module.exports = {
  getSalesPerformance,
  getProductSalesReport,
};
