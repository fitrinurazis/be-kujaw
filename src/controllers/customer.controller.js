const {
  Customer,
  Transaction,
  TransactionDetail,
  Product,
} = require("../models");
const { Op } = require("sequelize");

const getAllCustomers = async (req, res) => {
  try {
    const { search, sort = "name", order = "asc" } = req.query;

    const whereClause = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { nimSiakad: { [Op.like]: `%${search}%` } },
            { class: { [Op.like]: `%${search}%` } },
            // Remove progdi direct search since it's a relation
          ],
        }
      : {};

    const customers = await Customer.findAll({
      where: whereClause,
      order: [[sort, order]],
      include: [
        {
          model: Transaction,
          as: "transactions",
          attributes: ["id", "totalAmount", "transactionDate", "type"],
        },
        {
          model: Progdi,
          as: "progdi",
          attributes: ["id", "name"],
        },
      ],
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: Transaction,
          as: "transactions",
          attributes: ["id", "totalAmount", "transactionDate", "type"],
        },
        {
          model: Progdi,
          as: "progdi",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      nimSiakad,
      passwordSiakad,
      class: className,
      progdi_id,
      sales_id,
    } = req.body;

    const customer = await Customer.create({
      name,
      email,
      phone,
      nimSiakad,
      passwordSiakad,
      class: className,
      progdi_id,
      sales_id,
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Email or NIM Siakad already registered",
      });
    }
    res.status(400).json({ error: error.message });
  }
};
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      nimSiakad,
      passwordSiakad,
      class: className,
      progdi_id,
      sales_id,
    } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await customer.update({
      name,
      email,
      phone,
      nimSiakad,
      passwordSiakad,
      class: className,
      progdi_id,
      sales_id,
    });

    res.json(customer);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Email or NIM Siakad already registered",
      });
    }
    res.status(400).json({ error: error.message });
  }
};
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const transactionCount = await Transaction.count({
      where: { customerId: id },
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        error: "Cannot delete customer with existing transactions",
      });
    }

    await customer.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomerTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause = {
      customerId: id,
    };

    if (startDate && endDate) {
      whereClause.transactionDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: TransactionDetail,
          as: "details",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
      order: [["transactionDate", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
};
