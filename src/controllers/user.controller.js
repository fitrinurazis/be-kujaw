const { User, Transaction, Customer } = require("../models");

const getProfile = async (req, res) => {
  const freshUserData = await User.findByPk(req.user.id);
  res.json(freshUserData);
};

const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.avatar = req.file.filename;
    }

    await req.user.update(updates);
    // Fetch fresh user data after update
    const updatedUser = await User.findByPk(req.user.id);

    res.json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllSales = async (req, res) => {
  try {
    const salesUsers = await User.findAll({
      where: { role: "sales" },
      attributes: { exclude: ["password"] },
    });
    res.json({
      message: "Sales users retrieved successfully",
      data: salesUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getSalesById = async (req, res) => {
  try {
    const salesUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Transaction,
          as: "transactions",
          include: [
            {
              model: Customer,
              as: "customer",
            },
          ],
        },
        {
          model: Customer,
          as: "customers",
          include: [
            {
              model: Transaction,
              as: "transactions",
            },
          ],
        },
      ],
    });

    if (!salesUser) {
      return res.status(404).json({ error: "Sales user not found" });
    }

    res.json({
      message: "Sales user retrieved successfully",
      data: salesUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSalesUser = async (req, res) => {
  try {
    const user = await User.create({
      ...req.body,
      role: "sales",
    });
    res
      .status(201)
      .json({ message: "Sales user created successfully", data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateSalesUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "sales") {
      return res.status(404).json({ error: "Sales user not found" });
    }
    await user.update(req.body);
    res.json({ message: "Sales user updated successfully", data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteSalesUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "sales") {
      return res.status(404).json({ error: "Sales user not found" });
    }
    await user.destroy();
    res.status(204).json({ message: "Sales user deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllSales,
  getSalesById,
  createSalesUser,
  updateSalesUser,
  deleteSalesUser,
};
