const {
  Transaction,
  Product,
  Customer,
  User,
  TransactionDetail,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const getSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalIncome,
      totalExpense,
      totalProducts,
      totalCustomers,
      monthlySales,
    ] = await Promise.all([
      // Total Income
      Transaction.sum("totalAmount", {
        where: {
          type: "income",
        },
      }),
      // Total Expense
      Transaction.sum("totalAmount", {
        where: {
          type: "expense",
        },
      }),
      // Total Products
      Product.count(),
      // Total Customers
      Customer.count(),
      // Monthly Sales
      Transaction.sum("totalAmount", {
        where: {
          type: "income",
          transactionDate: {
            [Op.gte]: startOfMonth,
          },
        },
      }),
    ]);

    res.json({
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      totalProducts,
      totalCustomers,
      monthlySales: monthlySales || 0,
      netIncome: (totalIncome || 0) - (totalExpense || 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: Customer, as: "customer", attributes: ["name", "email"] },
        { model: User, as: "user", attributes: ["name"] },
      ],
      order: [["transactionDate", "DESC"]],
      limit: 10,
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const topProducts = await TransactionDetail.findAll({
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
        [sequelize.fn("SUM", sequelize.col("totalPrice")), "totalRevenue"],
      ],
      include: [
        { model: Product, as: "product", attributes: ["name", "price"] },
      ],
      group: ["productId"],
      order: [[sequelize.fn("SUM", sequelize.col("quantity")), "DESC"]],
      limit: 5,
    });

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Transaction.findAll({
      attributes: [
        "customerId",
        [
          sequelize.fn("COUNT", sequelize.col("Transaction.id")),
          "totalTransactions",
        ],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalSpent"],
      ],
      include: [
        { model: Customer, as: "customer", attributes: ["name", "email"] },
      ],
      where: { type: "income" },
      group: ["customerId", "customer.id"],
      order: [[sequelize.fn("SUM", sequelize.col("totalAmount")), "DESC"]],
      limit: 5,
    });

    res.json(topCustomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSalesChart = async (req, res) => {
  try {
    const lastDays = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lastDays);

    const dailySales = await Transaction.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("transactionDate")), "date"],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "total"],
      ],
      where: {
        type: "income",
        transactionDate: {
          [Op.gte]: startDate,
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("transactionDate"))],
      order: [[sequelize.fn("DATE", sequelize.col("transactionDate")), "ASC"]],
    });

    res.json(dailySales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getIncomeExpenseChart = async (req, res) => {
  try {
    const lastMonths = 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - lastMonths);

    const monthlyData = await Transaction.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("transactionDate")), "month"],
        [sequelize.fn("YEAR", sequelize.col("transactionDate")), "year"],
        "type",
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "total"],
      ],
      where: {
        transactionDate: {
          [Op.gte]: startDate,
        },
      },
      group: [
        sequelize.fn("MONTH", sequelize.col("transactionDate")),
        sequelize.fn("YEAR", sequelize.col("transactionDate")),
        "type",
      ],
      order: [
        [sequelize.fn("YEAR", sequelize.col("transactionDate")), "ASC"],
        [sequelize.fn("MONTH", sequelize.col("transactionDate")), "ASC"],
      ],
    });

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSummary,
  getRecentTransactions,
  getTopProducts,
  getTopCustomers,
  getSalesChart,
  getIncomeExpenseChart,
};
