const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const generatePDFReport = async (
  transactions,
  year,
  month,
  startDate,
  endDate
) => {
  return new Promise((resolve, reject) => {
    try {
      // Buat nama file yang relevan dengan periode
      const tempFilePath =
        startDate && endDate
          ? `transactions-${startDate.replace(/\//g, "-")}-to-${endDate.replace(
              /\//g,
              "-"
            )}.pdf`
          : `transactions-${year}-${month}.pdf`;

      // Buat PDF dengan orientasi landscape
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        layout: "landscape",
        bufferPages: true, // Penting untuk pagination
      });

      // Buat write stream
      const stream = fs.createWriteStream(tempFilePath);

      // Pipe PDF ke stream
      doc.pipe(stream);

      // Definisi struktur tabel
      const columns = [
        { header: "Transaction ID", property: "id", width: 100 },
        { header: "Date", property: "date", width: 100 },
        { header: "Customer", property: "customer", width: 120 },
        { header: "Salesperson", property: "salesperson", width: 120 },
        { header: "Type", property: "type", width: 80 },
        { header: "Total (Rp)", property: "total", width: 120 },
      ];

      // Hitung lebar tabel
      const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

      // Konstanta ukuran
      const ROW_HEIGHT = 20;
      const HEADER_HEIGHT = 25;
      const PAGE_MARGIN = 50;
      const LOGO_HEIGHT = 50;
      const HEADER_TEXT_HEIGHT = 60;

      // Jumlah baris maksimum per halaman
      const ROWS_PER_PAGE = Math.floor(
        (doc.page.height -
          PAGE_MARGIN * 2 -
          HEADER_HEIGHT -
          LOGO_HEIGHT -
          HEADER_TEXT_HEIGHT) /
          ROW_HEIGHT
      );

      // Track current page
      let currentPage = 1;

      // Untuk menyimpan grand total
      let grandTotal = 0;

      // Fungsi untuk menambahkan header dan logo di setiap halaman
      const addPageHeader = () => {
        // Logo perusahaan (asumsi logo.png ada di folder assets)
        try {
          const logoPath = path.join(__dirname, "../assets/logo.png");
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 50, { width: 100 });
          } else {
            console.log("Logo file not found:", logoPath);
            // Placeholder teks jika logo tidak ditemukan
            doc.font("Helvetica-Bold").fontSize(20).text("KUJAW", 50, 50);
          }
        } catch (err) {
          console.log("Error loading logo:", err.message);
          doc.font("Helvetica-Bold").fontSize(20).text("KUJAW", 50, 50);
        }

        // Header teks
        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(`SALES Report`, doc.page.width / 2, 50, { align: "center" });

        // Report period
        if (startDate && endDate) {
          doc
            .font("Helvetica")
            .fontSize(12)
            .text(
              `Period: ${startDate} to ${endDate}`,
              doc.page.width / 2,
              70,
              { align: "center" }
            );
        } else {
          doc
            .font("Helvetica")
            .fontSize(12)
            .text(`Period: ${month}/${year}`, doc.page.width / 2, 70, {
              align: "center",
            });
        }

        doc.moveDown(2);
      };

      // Fungsi untuk menggambar header tabel
      const drawTableHeader = (y) => {
        let x = 50;

        // Header background
        doc.fillColor("#4F81BD").rect(x, y, tableWidth, HEADER_HEIGHT).fill();

        // Header text
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);

        for (let i = 0; i < columns.length; i++) {
          doc.text(columns[i].header, x + 5, y + 7, {
            width: columns[i].width - 10,
            align: "center",
          });
          x += columns[i].width;
        }

        return y + HEADER_HEIGHT;
      };

      // Menambahkan halaman pertama dengan header
      addPageHeader();

      // Posisi awal tabel setelah header
      let y = 120; // Setelah header dan logo

      // Buat header tabel pada halaman pertama
      y = drawTableHeader(y);

      // Proses semua data transaksi dengan pagination
      for (let i = 0; i < transactions.length; i++) {
        // Cek apakah perlu halaman baru
        if (i % ROWS_PER_PAGE === 0 && i > 0) {
          // Tambahkan borders untuk halaman saat ini
          addTableBorders(y);

          // Tambah halaman baru
          doc.addPage();
          currentPage++;

          // Tambahkan header di halaman baru
          addPageHeader();

          // Reset posisi y di halaman baru
          y = 120;

          // Tambahkan header tabel di halaman baru
          y = drawTableHeader(y);
        }

        const item = transactions[i];

        // Calculate row position within current page
        const rowIndexInPage = i % ROWS_PER_PAGE;

        // Zebra striping
        if (rowIndexInPage % 2 === 0) {
          doc.fillColor("#E9EFF7").rect(50, y, tableWidth, ROW_HEIGHT).fill();
        }

        // Reset warna dan posisi untuk teks
        doc.fillColor("#000000");
        let x = 50;

        // Isi data per kolom
        for (let j = 0; j < columns.length; j++) {
          const column = columns[j];
          let value = item[column.property] || "";

          // Format mata uang untuk kolom total
          if (column.property === "total") {
            if (!isNaN(parseFloat(value))) {
              grandTotal += parseFloat(value);
              value = new Intl.NumberFormat("id-ID").format(value);
            }
          }

          // Posisi vertical tengah untuk teks
          const textY = y + ROW_HEIGHT / 2 - 4;

          doc.fontSize(9).text(String(value), x + 5, textY, {
            width: column.width - 10,
            align: column.property === "total" ? "right" : "left",
          });

          x += column.width;
        }

        y += ROW_HEIGHT;
      }

      // Tambahkan baris grand total
      addGrandTotalRow(y, grandTotal);

      // Tambahkan borders untuk tabel
      addTableBorders(y + 25); // +25 untuk tinggi baris grand total

      // Fungsi untuk menambahkan borders ke tabel
      function addTableBorders(endY) {
        const startY = 120; // Posisi awal tabel

        // Garis vertikal
        let xPos = 50;
        for (let i = 0; i <= columns.length; i++) {
          doc
            .strokeColor("#000000")
            .lineWidth(0.5)
            .moveTo(xPos, startY)
            .lineTo(xPos, endY)
            .stroke();

          if (i < columns.length) {
            xPos += columns[i].width;
          }
        }

        // Garis horizontal - header
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .moveTo(50, startY)
          .lineTo(50 + tableWidth, startY)
          .stroke();

        // Garis horizontal - setelah header
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .moveTo(50, startY + HEADER_HEIGHT)
          .lineTo(50 + tableWidth, startY + HEADER_HEIGHT)
          .stroke();

        // Garis horizontal untuk setiap baris data
        let rowY = startY + HEADER_HEIGHT;
        const rowCount = Math.ceil(
          (endY - (startY + HEADER_HEIGHT)) / ROW_HEIGHT
        );

        for (let i = 0; i <= rowCount; i++) {
          doc
            .strokeColor("#000000")
            .lineWidth(0.5)
            .moveTo(50, rowY)
            .lineTo(50 + tableWidth, rowY)
            .stroke();

          rowY += ROW_HEIGHT;
        }
      }

      // Fungsi untuk menambahkan baris grand total
      function addGrandTotalRow(y, total) {
        // Background footer
        doc.fillColor("#D3D3D3").rect(50, y, tableWidth, 25).fill();

        // Text "Grand Total"
        doc
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Grand Total:", 50 + tableWidth - 240, y + 7, {
            width: 120,
            align: "right",
          });

        // Nilai total
        const formattedTotal = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(total);

        doc.text(formattedTotal, 50 + tableWidth - 120, y + 7, {
          width: 110,
          align: "right",
        });
      }

      // Finalisasi PDF
      doc.end();

      // Event handlers
      stream.on("finish", () => {
        console.log(`PDF report created successfully: ${tempFilePath}`);
        resolve(tempFilePath);
      });

      stream.on("error", (err) => {
        console.error("Error writing PDF:", err);
        reject(err);
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      reject(error);
    }
  });
};

module.exports = { generatePDFReport };
