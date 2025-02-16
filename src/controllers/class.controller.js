const { Classes, Customer } = require("../models");

const getAllClass = async (req, res) => {
  try {
    const classes = await Classes.findAll({
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["id", "name"],
        },
      ],
    });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { name } = req.body;

    const classes = await Classes.create({
      name,
    });

    res.status(201).json(classes);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const classes = await Classes.findByPk(id);
    if (!classes) {
      return res.status(404).json({ error: "Category not found" });
    }

    await classes.update({ name });

    res.json(classes);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classes = await Classes.findByPk(id);
    if (!classes) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has associated products
    const customersCount = await Customer.count({ where: { class_id: id } });
    if (customersCount > 0) {
      return res.status(400).json({
        error: "Cannot delete category with associated products",
      });
    }

    await classes.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllClass,
  createClass,
  updateClass,
  deleteClass,
};
