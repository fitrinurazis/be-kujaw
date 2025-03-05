const PDFDocument = require("pdfkit");
const fs = require("fs");

const generatePDFReport = async (transactions, year, month) => {
  try {
    const tempFilePath = `transactions-${year}-${month}.pdf`;
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(tempFilePath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(16).text(`Transaction Report - ${month}/${year}`, {
      align: "center",
    });
    doc.moveDown();

    // Add transactions
    transactions.forEach((transaction) => {
      doc.fontSize(12).text(`Transaction ID: ${transaction.id}`);
      doc
        .fontSize(10)
        .text(
          `Date: ${transaction.transactionDate.toISOString().split("T")[0]}`
        );
      doc.text(`Customer: ${transaction.customer?.name || "Unknown"}`);
      // Products
      doc.text("Products:");
      transaction.details.forEach((detail) => {
        doc.text(
          `  - ${detail.product?.name || "Unknown Product"}: ${
            detail.quantity
          } x ${detail.pricePerUnit} = ${detail.totalPrice}`
        );
      });

      doc.text(`Total Amount: ${transaction.totalAmount}`);
      doc.moveDown();
    });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(tempFilePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("PDF generation failed: " + error.message);
  }
};

module.exports = { generatePDFReport };
