const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const generateExcelReport = async (transactions, year, month) => {
  try {
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
        date: transaction.transactionDate.toISOString().split("T")[0],
        id: transaction.id,
        customer: transaction.customer?.name || "Unknown",
        products: transaction.details
          .map((d) => {
            // Add null check for product
            if (!d.product) return `Unknown Product (${d.quantity})`;
            return `${d.product.name}(${d.quantity})`;
          })
          .join(", "),
        total: transaction.totalAmount,
      });
    });

    const tempFilePath = `transactions-${year}-${month}.xlsx`;
    await workbook.xlsx.writeFile(tempFilePath);

    return tempFilePath;
  } catch (error) {
    console.error("Excel generation failed:", error);
    throw new Error("Excel generation failed: " + error.message);
  }
};

module.exports = { generateExcelReport };
