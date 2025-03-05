const {
  Transaction,
  TransactionDetail,
  Product,
  Customer,
  User,
} = require("../models");
const { transactionSchema } = require("../validations/transaction.validation");
const { sequelize } = require("../models");
const {
  incomeTransactionSchema,
  expenseTransactionSchema,
} = require("../validations/transaction.validation");

const createIncomeTransaction = async (req, res) => {
  try {
    const validatedData = await incomeTransactionSchema.validate(req.body);

    const result = await sequelize.transaction(async (t) => {
      // Fetch products for price calculation
      const productIds = validatedData.details.map(
        (detail) => detail.productId
      );
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
      });

      // Calculate details with prices
      const detailsWithPrices = validatedData.details.map((detail) => {
        const product = products.find((p) => p.id === detail.productId);
        return {
          ...detail,
          pricePerUnit: product.price,
          totalPrice: detail.quantity * product.price,
        };
      });

      // Calculate total amount
      const totalAmount = detailsWithPrices.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice),
        0
      );

      // Create main transaction with userId from the request body
      const transaction = await Transaction.create(
        {
          userId: validatedData.userId, // This ensures userId is selectable from front-end
          customerId: validatedData.customerId,
          description: validatedData.description,
          totalAmount,
          transactionDate: new Date(),
          proofImage: req.file?.filename,
          type: "pemasukan",
        },
        { transaction: t }
      );

      // Create transaction details
      const details = await TransactionDetail.bulkCreate(
        detailsWithPrices.map((detail) => ({
          transactionId: transaction.id,
          productId: detail.productId,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          totalPrice: detail.totalPrice,
          status: detail.status || "menunggu", // Added status with default value similar to updateIncomeTransaction
        })),
        { transaction: t }
      );

      return { transaction, details };
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const createExpenseTransaction = async (req, res) => {
  try {
    const validatedData = await expenseTransactionSchema.validate(req.body);

    const result = await sequelize.transaction(async (t) => {
      const transaction = await Transaction.create(
        {
          userId: validatedData.userId,
          customerId: null,
          description: validatedData.description,
          totalAmount: validatedData.amount,
          transactionDate: new Date(),
          proofImage: req.file?.filename,
          type: "pengeluaran",
        },
        { transaction: t }
      );

      // Create expense details
      if (validatedData.details && validatedData.details.length > 0) {
        const details = await TransactionDetail.bulkCreate(
          validatedData.details.map((detail) => ({
            transactionId: transaction.id,
            itemName: detail.itemName, // Since expense doesn't relate to products
            quantity: detail.quantity,
            pricePerUnit: detail.pricePerUnit,
            totalPrice: detail.totalPrice,
            itemName: detail.itemName, // Add this field to track expense items
          })),
          { transaction: t }
        );
        return { transaction, details };
      }

      return { transaction };
    });

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
      return res.status(404).json({ error: "Tidak ada transaksi" });
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
        throw new Error("Tidak ada transaksi");
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
        throw new Error("Satu atau lebih produk tidak ditemukan");
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
        throw new Error("Tidak ada transaksi");
      }

      // Delete related details first
      await TransactionDetail.destroy({
        where: { transactionId: id },
        transaction: t,
      });

      // Delete main transaction
      await transaction.destroy({ transaction: t });
    });

    res.json({ message: "Transaksi berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const updateIncomeTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = await incomeTransactionSchema.validate(req.body);

    const result = await sequelize.transaction(async (t) => {
      const transaction = await Transaction.findByPk(id, { transaction: t });
      if (!transaction) {
        throw new Error("Tidak ada transaksi");
      }

      const productIds = validatedData.details.map(
        (detail) => detail.productId
      );
      const products = await Product.findAll({
        where: { id: productIds },
        transaction: t,
      });

      const detailsWithPrices = validatedData.details.map((detail) => {
        const product = products.find((p) => p.id === detail.productId);
        return {
          ...detail,
          pricePerUnit: product.price,
          totalPrice: detail.quantity * product.price,
        };
      });

      const totalAmount = detailsWithPrices.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice),
        0
      );

      await transaction.update(
        {
          customerId: validatedData.customerId,
          userId: validatedData.userId,
          description: validatedData.description,
          totalAmount,
          proofImage: req.file?.filename || transaction.proofImage,
        },
        { transaction: t }
      );

      await TransactionDetail.destroy({
        where: { transactionId: id },
        transaction: t,
      });

      const details = await TransactionDetail.bulkCreate(
        detailsWithPrices.map((detail) => ({
          transactionId: id,
          productId: detail.productId,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          totalPrice: detail.totalPrice,
          status: detail.status || "menunggu",
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

const updateExpenseTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = await expenseTransactionSchema.validate(req.body);

    const result = await sequelize.transaction(async (t) => {
      const transaction = await Transaction.findByPk(id, { transaction: t });
      if (!transaction) {
        throw new Error("Tidak ada transaksi");
      }

      await transaction.update(
        {
          userId: validatedData.userId,
          description: validatedData.description,
          totalAmount: validatedData.amount,
          proofImage: req.file?.filename || transaction.proofImage,
        },
        { transaction: t }
      );

      if (validatedData.details) {
        await TransactionDetail.destroy({
          where: { transactionId: id },
          transaction: t,
        });

        const details = await TransactionDetail.bulkCreate(
          validatedData.details.map((detail) => ({
            transactionId: id,
            itemName: detail.itemName,
            quantity: detail.quantity,
            pricePerUnit: detail.pricePerUnit,
            totalPrice: detail.totalPrice,
            status: detail.status || "menunggu",
          })),
          { transaction: t }
        );

        return { transaction, details };
      }

      return { transaction };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const updateTransactionDetailStatus = async (req, res) => {
  try {
    const { detailId } = req.params;
    const { status } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const detail = await TransactionDetail.findByPk(detailId, {
        transaction: t,
      });
      if (!detail) {
        throw new Error("Detail transaksi tidak ditemukan");
      }

      await detail.update({ status }, { transaction: t });

      // Get all details for this transaction
      const allDetails = await TransactionDetail.findAll({
        where: { transactionId: detail.transactionId },
        transaction: t,
      });

      // Check if all details are completed
      const allCompleted = allDetails.every((d) => d.status === "selesai");

      // Update transaction status if all details are completed
      if (allCompleted) {
        await Transaction.update(
          { status: "selesai" },
          {
            where: { id: detail.transactionId },
            transaction: t,
          }
        );
      }

      return {
        detail,
        transactionStatus: allCompleted ? "selesai" : "menunggu",
      };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteIncomeTransaction = async (req, res) => {
  try {
    // Add your income transaction delete logic here
    await deleteTransaction(req, res); // You can reuse the existing deleteTransaction function
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteExpenseTransaction = async (req, res) => {
  try {
    // Add your expense transaction delete logic here
    await deleteTransaction(req, res); // You can reuse the existing deleteTransaction function
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createIncomeTransaction,
  createExpenseTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  updateIncomeTransaction,
  updateExpenseTransaction,
  updateTransactionDetailStatus,
  deleteIncomeTransaction,
  deleteExpenseTransaction,
};
