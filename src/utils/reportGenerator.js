const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const {
  Transaction,
  TransactionDetail,
  Product,
  Customer,
  User,
} = require("../models");

class ReportGenerator {
  static async generateTransactionReport(transactionId) {
    const transaction = await Transaction.findOne({
      where: { id: transactionId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
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
    });

    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    // Format the data
    const reportData = {
      transactionId: transaction.id,
      date: transaction.transactionDate,

      customer: transaction.customer?.name || "Unknown Customer",
      salesperson: transaction.user?.name || "Unknown User",
      type: transaction.type,
      totalAmount: transaction.totalAmount,
      items: transaction.details.map((detail) => ({
        product: detail.product.name,
        quantity: detail.quantity,
        price: detail.pricePerUnit,
        total: detail.totalPrice,
      })),
    };

    return reportData;
  }

  static async toExcel(data, options) {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || "Report");

    worksheet.columns = options.columns;
    data.forEach((row) => worksheet.addRow(row));

    // Add some styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    const filePath = path.join(tempDir, options.fileName);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  static async toPDF(data, options) {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const doc = new PDFDocument();
    const filePath = path.join(tempDir, options.fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Add header/title
    doc.fontSize(16).text(options.title, { align: "center" });
    doc.moveDown();

    // Add date range if provided
    if (options.dateRange) {
      doc.fontSize(12).text(options.dateRange, { align: "center" });
      doc.moveDown();
    }
    // Add data rows
    data.forEach((row, index) => {
      // Add spacing between items
      if (index > 0) doc.moveDown(0.5);

      doc.fontSize(10).text(options.formatRow(row));

      // Add a separator line except for the last item
      if (index < data.length - 1) {
        doc.moveDown(0.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
      }
    });

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
    });
  }
}
module.exports = ReportGenerator;
