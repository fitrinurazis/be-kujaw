const { generatePDFReport } = require("../reportGenerator");

const generatePDFReport2 = async (transactions, year, month) => {
  try {
    // Konversi transaksi ke format yang diharapkan oleh generator PDF
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.transactionDate.toISOString().split("T")[0],
      customer: transaction.customer?.name || "Unknown",
      salesperson: transaction.user?.name || "Unknown User",
      type: transaction.type || "N/A",
      total: transaction.totalAmount || 0,
    }));

    // Gunakan fungsi generatePDFReport yang sudah diperbaiki
    const tempFilePath = await generatePDFReport(
      formattedTransactions,
      year,
      month
    );

    return tempFilePath;
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("PDF generation failed: " + error.message);
  }
};

module.exports = { generatePDFReport: generatePDFReport2 };
