const {
  Transaction,
  TransactionDetail,
  Customer,
  User,
  Product,
} = require("../../models");
const { Op } = require("sequelize");

const getReportData = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    // Add validation
    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Add error handling for future dates
    const currentDate = new Date();
    const endDateObj = new Date(endDate);

    // Optional: Add warning for future dates
    const isFutureDate = endDateObj > currentDate;

    let data = [];

    switch (reportType.toLowerCase()) {
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
            {
              model: TransactionDetail,
              as: "details",
              include: [{ model: Product, as: "product" }],
            },
          ],
          order: [["transactionDate", "ASC"]],
        });

        data = transactions.map((t) => ({
          id: t.id,
          date: t.transactionDate.toISOString().split("T")[0],
          customer: t.customer?.name || "Unknown Customer",
          salesperson: t.user?.name || "Unknown User",
          type: t.type,
          total: t.totalAmount,
          details: t.details.map((detail) => ({
            product: detail.product?.name || "Unknown Product",
            quantity: detail.quantity,
            price: detail.pricePerUnit,
            total: detail.totalPrice,
          })),
        }));
        break;

      case "products":
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

        // Add null checks in the reduce function
        const productSales = transactionDetails.reduce((acc, detail) => {
          // Skip if product is null
          if (!detail.product) return acc;

          const productId = detail.product.id;
          if (!acc[productId]) {
            acc[productId] = {
              productName: detail.product?.name || "Unknown Product",
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }
          acc[productId].totalQuantity += detail.quantity || 0;
          acc[productId].totalRevenue += parseFloat(detail.totalPrice || 0);
          return acc;
        }, {});

        data = Object.values(productSales);
        break;

      case "customers":
        const customerTransactions = await Transaction.findAll({
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

        const customerData = customerTransactions.reduce((acc, transaction) => {
          const customerId = transaction.customer?.id;
          if (!customerId) return acc;

          if (!acc[customerId]) {
            acc[customerId] = {
              customerId: customerId,
              customerName: transaction.customer?.name || "Unknown Customer",
              totalSpent: 0,
              transactionCount: 0,
            };
          }
          acc[customerId].totalSpent += parseFloat(
            transaction.totalAmount || 0
          );
          acc[customerId].transactionCount += 1;
          return acc;
        }, {});

        data = Object.values(customerData);
        break;

      case "income-expense":
        const incomeExpenseTransactions = await Transaction.findAll({
          where: {
            transactionDate: {
              [Op.between]: [new Date(startDate), new Date(endDate)],
            },
          },
        });

        const report = incomeExpenseTransactions.reduce(
          (acc, transaction) => {
            if (transaction.type === "pemasukan") {
              acc.totalIncome += parseFloat(transaction.totalAmount || 0);
            } else if (transaction.type === "pengeluaran") {
              acc.totalExpense += parseFloat(transaction.totalAmount || 0);
            }
            return acc;
          },
          { totalIncome: 0, totalExpense: 0, netIncome: 0 }
        );

        report.netIncome = report.totalIncome - report.totalExpense;

        data = [
          {
            period: `${startDate} to ${endDate}`,
            totalIncome: report.totalIncome.toFixed(2),
            totalExpense: report.totalExpense.toFixed(2),
            netIncome: report.netIncome.toFixed(2),
          },
        ];
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    return res.json({
      success: true,
      reportType,
      period: {
        startDate,
        endDate,
        isFutureDate,
      },
      data,
    });
  } catch (error) {
    console.error("Error in getReportData:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

module.exports = {
  getReportData,
};
