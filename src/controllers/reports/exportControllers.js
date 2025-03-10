const ExcelJS = require("exceljs");
const fs = require("fs");
const {
  Transaction,
  TransactionDetail,
  Customer,
  Product,
  User,
} = require("../../models");
const { Op } = require("sequelize");
const {
  handleFileDownload,
} = require("../../utils/fileHandlers/downloadHandler");
const { generatePDFReport } = require("../../utils/reportGenerator");

const exportToExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    if (!reportType || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Report type, start date and end date are required" });
    }

    let data = [];
    let options = {
      fileName: `${reportType}-report.xlsx`,
      sheetName: `${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      } Report`,
      columns: [],
    };

    switch (reportType.toLowerCase()) {
      case "sales":
        const transactions = await Transaction.findAll({
          where: {
            transactionDate: {
              [Op.between]: [new Date(startDate), new Date(endDate)],
            },
          },
          include: [
            { model: Customer, as: "customer" },
            { model: User, as: "user" },
          ],
        });

        options.columns = [
          { header: "Date", key: "date", width: 15 },
          { header: "Transaction ID", key: "id", width: 15 },
          { header: "Customer", key: "customer", width: 20 },
          { header: "Salesperson", key: "salesperson", width: 20 },
          { header: "Type", key: "type", width: 15 },
          { header: "Total", key: "total", width: 15 },
        ];

        data = transactions.map((t) => ({
          date: t.transactionDate.toISOString().split("T")[0],
          id: t.id,
          customer: t.customer?.name || "Unknown Customer",
          salesperson: t.user?.name || "Unknown User",
          type: t.type,
          total: t.totalAmount,
        }));
        break;

      case "products":
        // Kode untuk products report (tidak berubah)
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

        options.columns = [
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Total Quantity", key: "totalQuantity", width: 15 },
          { header: "Total Revenue", key: "totalRevenue", width: 20 },
        ];

        data = Object.values(productSales);
        break;

      case "customers":
        // Kode untuk customers report (tidak berubah)
        const customerTransactions = await Transaction.findAll({
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

        const customerData = customerTransactions.reduce((acc, transaction) => {
          const customerId = transaction.customer?.id;
          if (!customerId) return acc;

          if (!acc[customerId]) {
            acc[customerId] = {
              customerName: transaction.customer?.name || "Unknown Customer",
              totalSpent: 0,
              transactionCount: 0,
            };
          }
          acc[customerId].totalSpent += parseFloat(
            transaction.totalAmount || 0
          );
          acc[customerId].transactionCount += 1;
          return acc;
        }, {});

        options.columns = [
          { header: "Customer Name", key: "customerName", width: 30 },
          { header: "Total Spent", key: "totalSpent", width: 15 },
          { header: "Transaction Count", key: "transactionCount", width: 20 },
        ];

        data = Object.values(customerData);
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName);

    worksheet.columns = options.columns;

    data.forEach((item) => {
      worksheet.addRow(item);
    });

    const tempFilePath = options.fileName;
    await workbook.xlsx.writeFile(tempFilePath);

    return await handleFileDownload(tempFilePath, res);
  } catch (error) {
    console.error("Export error:", error);
    return res
      .status(500)
      .json({ error: "Failed to export to Excel: " + error.message });
  }
};

const exportToPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    if (!reportType || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Report type, start date and end date are required" });
    }

    let transactions = [];

    switch (reportType.toLowerCase()) {
      case "sales":
        transactions = await Transaction.findAll({
          where: {
            transactionDate: {
              [Op.between]: [new Date(startDate), new Date(endDate)],
            },
          },
          include: [
            { model: Customer, as: "customer" },
            { model: User, as: "user" },
          ],
          order: [["transactionDate", "ASC"]],
        });

        // Format data untuk PDF generator
        transactions = transactions.map((t) => ({
          id: t.id,
          date: t.transactionDate.toISOString().split("T")[0],
          customer: t.customer?.name || "Unknown Customer",
          salesperson: t.user?.name || "Unknown User",
          type: t.type,
          total: t.totalAmount,
        }));
        break;

      case "products":
        // Mengambil data produk
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

        // Mengolah data untuk format laporan produk
        const productSales = transactionDetails.reduce((acc, detail) => {
          if (!detail.product) return acc;

          const productId = detail.product.id;
          if (!acc[productId]) {
            acc[productId] = {
              id: productId,
              date: "-",
              customer: "-",
              salesperson: "-",
              type: "PRODUCT",
              productName: detail.product.name,
              totalQuantity: 0,
              totalRevenue: 0,
              total: 0,
            };
          }
          acc[productId].totalQuantity += detail.quantity || 0;
          acc[productId].totalRevenue += parseFloat(detail.totalPrice || 0);
          acc[productId].total = acc[productId].totalRevenue;
          return acc;
        }, {});

        transactions = Object.values(productSales);
        break;

      case "customers":
        // Mengambil data transaksi pelanggan
        const customerTransactions = await Transaction.findAll({
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

        // Mengolah data untuk format laporan pelanggan
        const customerData = customerTransactions.reduce((acc, transaction) => {
          const customerId = transaction.customer?.id;
          if (!customerId) return acc;

          if (!acc[customerId]) {
            acc[customerId] = {
              id: customerId,
              date: "-",
              customer: transaction.customer?.name || "Unknown Customer",
              salesperson: "-",
              type: "CUSTOMER",
              totalSpent: 0,
              transactionCount: 0,
              total: 0,
            };
          }
          acc[customerId].totalSpent += parseFloat(
            transaction.totalAmount || 0
          );
          acc[customerId].transactionCount += 1;
          acc[customerId].total = acc[customerId].totalSpent;
          return acc;
        }, {});

        transactions = Object.values(customerData);
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    // Menggunakan fungsi generatePDFReport yang sudah diperbaiki
    const tempFilePath = await generatePDFReport(
      transactions,
      year,
      month,
      startDate,
      endDate
    );

    return await handleFileDownload(tempFilePath, res);
  } catch (error) {
    console.error("Export to PDF error:", error);
    return res.status(500).json({
      error: "Failed to export to PDF",
      details: error.message,
    });
  }
};

module.exports = {
  exportToExcel,
  exportToPDF,
};
