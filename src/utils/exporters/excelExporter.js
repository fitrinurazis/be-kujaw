const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const generateExcelReport = async (transactions, year, month) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");

    // Header style
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
    };

    // Definisi kolom dengan style yang lebih baik
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Transaction ID", key: "id", width: 15 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Products", key: "products", width: 30 },
      { header: "Total Amount", key: "total", width: 15 },
    ];

    // Apply header style
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Format data untuk laporan
    transactions.forEach((transaction, index) => {
      const rowData = {
        date: transaction.transactionDate.toISOString().split("T")[0],
        id: transaction.id,
        customer: transaction.customer?.name || "Unknown",
        products: transaction.details
          .map((d) => {
            if (!d.product) return `Unknown Product (${d.quantity})`;
            return `${d.product.name}(${d.quantity})`;
          })
          .join(", "),
        total: transaction.totalAmount,
      };

      // Tambahkan data ke worksheet
      const row = worksheet.addRow(rowData);

      // Zebra striping untuk baris
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E9EFF7" },
          };
        });
      }

      // Format mata uang untuk kolom total
      worksheet.getCell(`E${index + 2}`).numFmt = "#,##0";
    });

    // Tambahkan total baris
    const totalRow = worksheet.addRow({
      date: "",
      id: "",
      customer: "",
      products: "GRAND TOTAL",
      total: transactions.reduce(
        (sum, t) => sum + parseFloat(t.totalAmount || 0),
        0
      ),
    });

    // Styling untuk total row
    totalRow.eachCell((cell) => {
      cell.style = {
        font: { bold: true },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D3D3D3" },
        },
      };
    });

    worksheet.getCell(`E${transactions.length + 2}`).numFmt = "#,##0";

    // Tambahkan border ke semua sel dalam tabel
    for (let i = 1; i <= transactions.length + 2; i++) {
      worksheet.getRow(i).eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    const tempFilePath = `transactions-${year}-${month}.xlsx`;
    await workbook.xlsx.writeFile(tempFilePath);

    return tempFilePath;
  } catch (error) {
    console.error("Excel generation failed:", error);
    throw new Error("Excel generation failed: " + error.message);
  }
};

module.exports = { generateExcelReport };
