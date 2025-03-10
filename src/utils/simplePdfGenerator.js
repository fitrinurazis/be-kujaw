const fs = require("fs");
const PDFDocument = require("pdfkit");

function generateSimplePDF() {
  return new Promise((resolve, reject) => {
    try {
      // Nama file dengan timestamp untuk menghindari cache
      const filename = `test-pdf-${Date.now()}.pdf`;
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(filename);

      // Pipe PDF ke writeStream
      doc.pipe(writeStream);

      // Tambahkan konten sederhana
      doc.fontSize(25).text("Kujaw Test PDF Document", 100, 100);
      doc.fontSize(15).text("Ini adalah PDF pengujian", 100, 150);

      // Tambahkan tanggal dan waktu untuk memverifikasi PDF baru
      doc
        .fontSize(12)
        .text(`Generated: ${new Date().toLocaleString()}`, 100, 200);

      // Finalisasi PDF (penting!)
      doc.end();

      // Handler untuk stream events
      writeStream.on("finish", () => {
        console.log(`PDF created successfully at: ${filename}`);
        resolve(filename);
      });

      writeStream.on("error", (err) => {
        console.error("Error writing PDF:", err);
        reject(err);
      });
    } catch (error) {
      console.error("Error in PDF generation:", error);
      reject(error);
    }
  });
}

module.exports = { generateSimplePDF };
