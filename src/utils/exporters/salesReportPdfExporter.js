const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateSalesReport = async (transactions, startDate, endDate) => {
  try {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "..", "..", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = `SalesReport_${startDate}_to_${endDate}.pdf`;
    const filePath = path.join(tempDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header styling
    doc.font("Helvetica-Bold").fontSize(16).text("SALES Report", {
      align: "center",
    });
    doc.moveDown(0.5);

    // Period information
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Period: ${startDate} to ${endDate}`, { align: "center" });
    doc.moveDown(1.5);

    // ===== TABLE SETUP =====
    const tableTop = doc.y;
    const tableWidth = 500;

    // Define columns for the table
    const columns = [
      { header: "Transaction ID", property: "id", width: 80, align: "center" },
      { header: "Date", property: "date", width: 80, align: "center" },
      { header: "Customer", property: "customer", width: 80 },
      { header: "Salesperson", property: "salesperson", width: 100 },
      { header: "Type", property: "type", width: 80, align: "center" },
      { header: "Total", property: "total", width: 80, align: "right" },
    ];

    // ===== TABLE RENDERING FUNCTIONS =====
    // Draw table header
    const drawTableHeader = (y) => {
      doc.lineWidth(1).fillColor("#e0e0e0");

      let x = 50;

      // Draw header background
      doc.rect(x, y, tableWidth, 20).fill();

      // Draw column headers
      doc.fillColor("#000000");
      columns.forEach((column) => {
        const textX =
          column.align === "right"
            ? x + column.width - 5
            : column.align === "center"
            ? x + column.width / 2
            : x + 5;

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(column.header, textX, y + 5, {
            width: column.width,
            align: column.align || "left",
          });

        // Vertical column line
        doc
          .moveTo(x, y)
          .lineTo(x, y + 20)
          .stroke();

        x += column.width;
      });

      // Last vertical line
      doc
        .moveTo(x, y)
        .lineTo(x, y + 20)
        .stroke();

      // Top horizontal line
      doc
        .moveTo(50, y)
        .lineTo(50 + tableWidth, y)
        .stroke();

      // Bottom horizontal line
      doc
        .moveTo(50, y + 20)
        .lineTo(50 + tableWidth, y + 20)
        .stroke();

      return y + 20;
    };

    // Draw table row
    const drawTableRow = (row, y, isAlternate = false) => {
      let x = 50;
      const rowHeight = 20;

      // Alternate row background
      if (isAlternate) {
        doc.fillColor("#f9f9f9").rect(x, y, tableWidth, rowHeight).fill();
      }

      doc.fillColor("#000000");

      // Draw each cell
      columns.forEach((column) => {
        let value = row[column.property];

        // Format total with currency
        if (column.property === "total") {
          value = `Rp ${parseFloat(value).toLocaleString("id-ID", {
            minimumFractionDigits: 2,
          })}`;
        }

        // Format type with consistent styling
        if (column.property === "type") {
          value = value.charAt(0).toUpperCase() + value.slice(1);

          // Optional: Set text color based on type
          if (value.toLowerCase() === "pemasukan") {
            doc.fillColor("#006400"); // Dark green for income
          } else if (value.toLowerCase() === "pengeluaran") {
            doc.fillColor("#8B0000"); // Dark red for expense
          }
        }

        const textX =
          column.align === "right"
            ? x + column.width - 5
            : column.align === "center"
            ? x + column.width / 2
            : x + 5;

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(value.toString(), textX, y + 5, {
            width: column.width,
            align: column.align || "left",
          });

        // Reset text color
        doc.fillColor("#000000");

        // Vertical column line
        doc
          .moveTo(x, y)
          .lineTo(x, y + rowHeight)
          .stroke();

        x += column.width;
      });

      // Last vertical line
      doc
        .moveTo(x, y)
        .lineTo(x, y + rowHeight)
        .stroke();

      // Bottom horizontal line
      doc
        .moveTo(50, y + rowHeight)
        .lineTo(50 + tableWidth, y + rowHeight)
        .stroke();

      return y + rowHeight;
    };

    // ===== RENDER TABLE =====
    // Draw header
    let y = drawTableHeader(tableTop);

    // Draw rows
    transactions.forEach((transaction, index) => {
      // Check if we need a new page
      if (y > doc.page.height - 70) {
        doc.addPage();
        y = 50;
        y = drawTableHeader(y);
      }

      y = drawTableRow(transaction, y, index % 2 === 0);
    });

    // Calculate totals
    const totalPemasukan = transactions
      .filter((t) => t.type.toLowerCase() === "pemasukan")
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    const totalPengeluaran = transactions
      .filter((t) => t.type.toLowerCase() === "pengeluaran")
      .reduce((sum, t) => sum + parseFloat(t.total), 0);

    const netTotal = totalPemasukan - totalPengeluaran;

    // Add summary section
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Summary:", 50, doc.y);
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    doc.text(
      `Total Pemasukan: Rp ${totalPemasukan.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
      })}`,
      70,
      doc.y
    );
    doc.moveDown(0.3);
    doc.text(
      `Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
      })}`,
      70,
      doc.y
    );
    doc.moveDown(0.3);

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(
      `Net Total: Rp ${netTotal.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
      })}`,
      70,
      doc.y
    );

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Sales report generation failed:", error);
    throw new Error("Sales report generation failed: " + error.message);
  }
};

module.exports = { generateSalesReport };
