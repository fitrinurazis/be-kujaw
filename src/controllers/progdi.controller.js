const { Progdis, Customer } = require("../models");

const getAllProgdi = async (req, res) => {
  try {
    const progdi = await Progdis.findAll({
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["id", "name"],
        },
      ],
    });

    res.json(progdi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProgdi = async (req, res) => {
  try {
    const { name } = req.body;

    const progdi = await Progdis.create({
      name,
    });

    res.status(201).json(progdi);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};
const updateProgdi = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const progdi = await Progdis.findByPk(id);
    if (!progdi) {
      return res.status(404).json({ error: "Category not found" });
    }

    await progdi.update({ name });

    res.json(progdi);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteProgdi = async (req, res) => {
  try {
    const { id } = req.params;

    const progdi = await Progdis.findByPk(id);
    if (!progdi) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has associated products
    const customersCount = await Customer.count({ where: { progdi_id: id } });
    if (customersCount > 0) {
      return res.status(400).json({
        error: "Cannot delete category with associated products",
      });
    }

    await progdi.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProgdi,
  createProgdi,
  updateProgdi,
  deleteProgdi,
};
