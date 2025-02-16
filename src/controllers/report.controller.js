const {
  Transaction,
  TransactionDetail,
  Product,
  Customer,
  User,
} = require("../models");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const { unlink } = require("fs").promises;
const ReportGenerator = require("../utils/reportGenerator");

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, format = "json" } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

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
        },
        {
          model: TransactionDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
      order: [["transactionDate", "ASC"]],
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified period",
      });
    }

    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(transactions, year, month, res);
      case "pdf":
        return await generatePDFReport(transactions, year, month, res);
      case "json":
      default:
        const jsonData = transactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.transactionDate,
          customer: transaction.customer?.name,
          totalAmount: transaction.totalAmount,
          details: transaction.details.map((detail) => ({
            product: detail.product.name,
            quantity: detail.quantity,
            price: detail.pricePerUnit,
            total: detail.totalPrice,
          })),
        }));
        return res.json(jsonData);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
};
const getDailyReport = async (req, res) => {
  try {
    const { date, format = "json" } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const searchDate = new Date(date);
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
        },
        {
          model: TransactionDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
      order: [["transactionDate", "ASC"]],
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for the specified date",
      });
    }

    const dailyData = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.transactionDate,
      customer: transaction.customer?.name,
      details: transaction.details.map((detail) => ({
        product: detail.product.name,
        quantity: detail.quantity,
        price: detail.pricePerUnit,
        total: detail.totalPrice,
      })),
      totalAmount: transaction.totalAmount,
    }));

    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(
          transactions,
          searchDate.getFullYear(),
          searchDate.getMonth() + 1,
          res
        );
      case "pdf":
        return await generatePDFReport(
          transactions,
          searchDate.getFullYear(),
          searchDate.getMonth() + 1,
          res
        );
      case "json":
      default:
        return res.json(dailyData);
    }
  } catch (error) {
    console.error("Error generating daily report:", error);
    return res.status(500).json({ error: "Failed to generate daily report" });
  }
};
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

    const salesPerformance = transactions.reduce((acc, transaction) => {
      const userId = transaction.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          name: transaction.user.name,
          totalSales: 0,
          transactionCount: 0,
        };
      }
      acc[userId].totalSales += parseFloat(transaction.totalAmount);
      acc[userId].transactionCount += 1;
      return acc;
    }, {});

    const salesData = Object.values(salesPerformance);

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await ReportGenerator.toExcel(salesData, {
          sheetName: "Sales Performance",
          fileName: "sales-performance.xlsx",
          columns: [
            { header: "Name", key: "name", width: 20 },
            { header: "Total Sales", key: "totalSales", width: 15 },
            { header: "Transaction Count", key: "transactionCount", width: 15 },
          ],
        });
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await ReportGenerator.toPDF(salesData, {
          title: "Sales Performance Report",
          fileName: "sales-performance.pdf",
          formatRow: (row) =>
            `Name: ${row.name}\nTotal Sales: ${row.totalSales}\nTransaction Count: ${row.transactionCount}`,
        });
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        return res.json(salesData);
    }
  } catch (error) {
    console.error("Error generating sales performance:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate sales performance report" });
  }
};
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

    const productSales = transactionDetails.reduce((acc, detail) => {
      const productId = detail.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          productName: detail.product.name,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[productId].totalQuantity += detail.quantity;
      acc[productId].totalRevenue += parseFloat(detail.totalPrice);
      return acc;
    }, {});

    const productSalesData = Object.values(productSales);

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await ReportGenerator.toExcel(productSalesData, {
          sheetName: "Product Sales",
          fileName: "product-sales.xlsx",
          columns: [
            { header: "Product Name", key: "productName", width: 30 },
            { header: "Total Quantity", key: "totalQuantity", width: 15 },
            { header: "Total Revenue", key: "totalRevenue", width: 20 },
          ],
        });
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await ReportGenerator.toPDF(productSalesData, {
          title: "Product Sales Report",
          fileName: "product-sales.pdf",
          formatRow: (row) =>
            `Product: ${row.productName}\nQuantity Sold: ${row.totalQuantity}\nTotal Revenue: ${row.totalRevenue}`,
        });
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        return res.json(productSalesData);
    }
  } catch (error) {
    console.error("Error generating product sales report:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate product sales report" });
  }
};
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

    const customerTransactions = transactions.reduce((acc, transaction) => {
      const customerId = transaction.customer?.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerName: transaction.customer?.name || "Unknown Customer",
          totalSpent: 0,
          transactionCount: 0,
        };
      }
      acc[customerId].totalSpent += parseFloat(transaction.totalAmount);
      acc[customerId].transactionCount += 1;
      return acc;
    }, {});

    const customerData = Object.values(customerTransactions);

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await ReportGenerator.toExcel(customerData, {
          sheetName: "Customer Transactions",
          fileName: "customer-transactions.xlsx",
          columns: [
            { header: "Customer Name", key: "customerName", width: 30 },
            { header: "Total Spent", key: "totalSpent", width: 15 },
            { header: "Transaction Count", key: "transactionCount", width: 20 },
          ],
        });
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await ReportGenerator.toPDF(customerData, {
          title: "Customer Transactions Report",
          fileName: "customer-transactions.pdf",
          formatRow: (row) =>
            `Customer: ${
              row.customerName
            }\nTotal Spent: ${row.totalSpent.toFixed(2)}\nTransaction Count: ${
              row.transactionCount
            }`,
        });
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        return res.json(customerData);
    }
  } catch (error) {
    console.error("Error generating customer transactions report:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate customer transactions report" });
  }
};
const getIncomeExpenseReport = async (req, res) => {
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
    });

    const report = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "INCOME") {
          acc.totalIncome += parseFloat(transaction.totalAmount);
        } else if (transaction.type === "EXPENSE") {
          acc.totalExpense += parseFloat(transaction.totalAmount);
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, netIncome: 0 }
    );

    report.netIncome = report.totalIncome - report.totalExpense;

    const reportData = [
      {
        period: `${startDate} to ${endDate}`,
        totalIncome: report.totalIncome.toFixed(2),
        totalExpense: report.totalExpense.toFixed(2),
        netIncome: report.netIncome.toFixed(2),
      },
    ];

    switch (format.toLowerCase()) {
      case "excel": {
        const filePath = await ReportGenerator.toExcel(reportData, {
          sheetName: "Income Expense Summary",
          fileName: "income-expense.xlsx",
          columns: [
            { header: "Period", key: "period", width: 30 },
            { header: "Total Income", key: "totalIncome", width: 15 },
            { header: "Total Expense", key: "totalExpense", width: 15 },
            { header: "Net Income", key: "netIncome", width: 15 },
          ],
        });
        return await handleFileDownload(filePath, res);
      }
      case "pdf": {
        const filePath = await ReportGenerator.toPDF(reportData, {
          title: "Income Expense Report",
          fileName: "income-expense.pdf",
          formatRow: (row) =>
            `Period: ${row.period}\nTotal Income: ${row.totalIncome}\nTotal Expense: ${row.totalExpense}\nNet Income: ${row.netIncome}`,
        });
        return await handleFileDownload(filePath, res);
      }
      case "json":
      default:
        return res.json(reportData[0]);
    }
  } catch (error) {
    console.error("Error generating income/expense report:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate income/expense report" });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    if (!reportType || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Report type, start date and end date are required" });
    }

    let data = [];
    let columns = [];

    switch (reportType) {
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

        columns = [
          { header: "Date", key: "date" },
          { header: "Transaction ID", key: "id" },
          { header: "Customer", key: "customer" },
          { header: "Salesperson", key: "salesperson" },
          { header: "Total", key: "total" },
        ];

        data = transactions.map((t) => ({
          date: t.transactionDate,
          id: t.id,
          customer: t.customer?.name || "Unknown Customer",
          salesperson: t.user?.name || "Unknown User",
          total: t.totalAmount,
        }));
        break;

      case "products":
        // Add product report implementation here
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    const options = {
      sheetName: `${reportType} Report`,
      fileName: `${reportType}-report.xlsx`,
      columns: [
        { header: "Date", key: "date" },
        { header: "Transaction ID", key: "id" },
        // Add other required columns
      ],
    };

    const filePath = await ReportGenerator.toExcel(data, options);
    await handleFileDownload(filePath, res);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Failed to export to Excel" });
  }
};

const exportToPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    if (!reportType || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Report type, start date and end date are required" });
    }

    let data = [];
    const options = {
      title: `${reportType.toUpperCase()} Report`,
      fileName: `${reportType}-report.pdf`,
      formatRow: (row) => `${Object.values(row).join(" | ")}`,
    };
    switch (reportType) {
      case "sales":
        // Implement sales report data gathering
        break;
      case "products":
        // Implement products report data gathering
        break;
      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    const filePath = await ReportGenerator.toPDF(data, options);
    await handleFileDownload(filePath, res);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Failed to export to PDF" });
  }
};

const generateExcelReport = async (transactions, year, month, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Transactions");

  worksheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Transaction ID", key: "id", width: 15 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Products", key: "products", width: 30 },
    { header: "Total Amount", key: "total", width: 15 },
  ];

  transactions.forEach((transaction) => {
    worksheet.addRow({
      date: transaction.transactionDate,
      id: transaction.id,
      customer: transaction.customer?.name || "Unknown",
      products: transaction.details
        .map((d) => `${d.product.name}(${d.quantity})`)
        .join(", "),
      total: transaction.totalAmount,
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=transactions-${year}-${month}.xlsx`
  );

  return await workbook.xlsx.write(res);
};

const handleFileDownload = async (filePath, res) => {
  try {
    await res.download(filePath);
    setTimeout(async () => {
      try {
        await unlink(filePath);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }, 1000);
  } catch (error) {
    throw new Error("Download failed");
  }
};

const generatePDFReport = async (transactions, year, month, res) => {
  try {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions-${year}-${month}.pdf`
    );

    doc.pipe(res);

    // Add title
    doc.fontSize(16).text(`Transaction Report - ${month}/${year}`, {
      align: "center",
    });
    doc.moveDown();

    // Add transactions
    transactions.forEach((transaction) => {
      doc.fontSize(12).text(`Transaction ID: ${transaction.id}`);
      doc.fontSize(10).text(`Date: ${transaction.transactionDate}`);
      doc.text(`Customer: ${transaction.customer?.name || "Unknown"}`);

      // Products
      doc.text("Products:");
      transaction.details.forEach((detail) => {
        doc.text(
          `  - ${detail.product.name}: ${detail.quantity} x ${detail.pricePerUnit} = ${detail.totalPrice}`
        );
      });

      doc.text(`Total Amount: ${transaction.totalAmount}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    throw new Error("PDF generation failed");
  }
};

module.exports = {
  getMonthlyReport,
  getDailyReport,
  getSalesPerformance,
  getProductSalesReport,
  getCustomerTransactionsReport,
  getIncomeExpenseReport,
  exportToExcel,
  exportToPDF,
  generatePDFReport,
  generateExcelReport,
};
