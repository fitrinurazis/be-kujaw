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
  async generateTransactionReport(transactionId) {
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

    // You can format the data as needed
    const reportData = {
      transactionId: transaction.id,
      date: transaction.transactionDate,
      customer: transaction.customer.name,
      salesperson: transaction.user.name,
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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName);

    worksheet.columns = options.columns;
    data.forEach((row) => worksheet.addRow(row));

    const filePath = path.join(__dirname, "..", "temp", options.fileName);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  static async toPDF(data, options) {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, "..", "temp", options.fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    doc.fontSize(16).text(options.title, { align: "center" });
    doc.moveDown();

    data.forEach((row) => {
      doc.fontSize(10).text(options.formatRow(row));
      doc.moveDown();
    });

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
    });
  }
}

module.exports = ReportGenerator;
