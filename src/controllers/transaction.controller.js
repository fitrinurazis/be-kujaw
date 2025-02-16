const {
  Transaction,
  TransactionDetail,
  Product,
  Customer,
  User,
} = require("../models");
const { transactionSchema } = require("../validations/transaction.validation");
const ReportGenerator = require("../utils/reportGenerator");
const { sequelize } = require("../models");

const createTransaction = async (req, res) => {
  try {
    const validatedData = await transactionSchema.validate(req.body);

    // Get the authenticated user
    const currentUser = req.user;

    // Determine the userId to use
    const transactionUserId =
      currentUser.role === "admin"
        ? validatedData.userId // Admin can set any userId
        : currentUser.id; // Non-admin must use their own id

    const result = await sequelize.transaction(async (t) => {
      // Fetch all products first to get their prices
      const productIds = validatedData.details.map(
        (detail) => detail.productId
      );
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
      });

      // Add this check
      if (products.length !== productIds.length) {
        throw new Error("One or more products not found");
      }

      // Create details array with prices from products
      const detailsWithPrices = validatedData.details.map((detail) => {
        const product = products.find((p) => p.id === detail.productId);
        if (!product || !product.price) {
          throw new Error(`Invalid price for product ${detail.productId}`);
        }
        return {
          ...detail,
          pricePerUnit: product.price,
        };
      });

      // Calculate total amount using product prices
      const totalAmount = detailsWithPrices.reduce(
        (sum, item) => sum + item.quantity * item.pricePerUnit,
        0
      );
      // Create main transaction
      const transaction = await Transaction.create(
        {
          customerId: validatedData.customerId,
          userId: transactionUserId, // Use the determined userId
          description: validatedData.description,
          type: validatedData.type,
          transactionDate: new Date(),
          proofImage: req.file?.filename,
          totalAmount,
        },
        { transaction: t }
      );
      // Create details with product prices
      const details = await TransactionDetail.bulkCreate(
        detailsWithPrices.map((detail) => ({
          transactionId: transaction.id,
          productId: detail.productId,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          totalPrice: detail.quantity * detail.pricePerUnit,
        })),
        { transaction: t }
      );

      return { transaction, details };
    });
    // Generate report after transaction is created
    const report = new ReportGenerator();
    const reportData = await report.generateTransactionReport(
      result.transaction.id
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: Customer, as: "customer" },
        {
          model: TransactionDetail,
          as: "details",
          include: [{ model: Product, as: "product" }],
        },
      ],
      order: [["transactionDate", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id },
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: Customer, as: "customer" },
        {
          model: TransactionDetail,
          as: "details",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = await transactionSchema.validate(req.body);

    const result = await sequelize.transaction(async (t) => {
      // Get existing transaction
      const transaction = await Transaction.findByPk(id, { transaction: t });
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Fetch products for price validation
      const productIds = validatedData.details.map(
        (detail) => detail.productId
      );
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products not found");
      }

      // Prepare details with prices
      const detailsWithPrices = validatedData.details.map((detail) => {
        const product = products.find((p) => p.id === detail.productId);
        return {
          ...detail,
          pricePerUnit: product.price,
          totalPrice: detail.quantity * product.price,
        };
      });

      // Calculate new total amount
      const totalAmount = detailsWithPrices.reduce(
        (sum, item) => sum + item.quantity * item.pricePerUnit,
        0
      );

      // Update main transaction
      await transaction.update(
        {
          customerId: validatedData.customerId,
          userId: validatedData.userId,
          description: validatedData.description,
          type: validatedData.type,
          totalAmount,
          proofImage: req.file?.filename || transaction.proofImage,
        },
        { transaction: t }
      );

      // Delete existing details
      await TransactionDetail.destroy({
        where: { transactionId: id },
        transaction: t,
      });

      // Create new details
      const details = await TransactionDetail.bulkCreate(
        detailsWithPrices.map((detail) => ({
          transactionId: id,
          productId: detail.productId,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          totalPrice: detail.quantity * detail.pricePerUnit,
        })),
        { transaction: t }
      );

      return { transaction, details };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sequelize.transaction(async (t) => {
      // Find transaction
      const transaction = await Transaction.findByPk(id, { transaction: t });
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Delete related details first
      await TransactionDetail.destroy({
        where: { transactionId: id },
        transaction: t,
      });

      // Delete main transaction
      await transaction.destroy({ transaction: t });
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
