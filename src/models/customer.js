"use strict";

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define("Customer", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
    nimSiakad: {
      type: DataTypes.STRING,
      unique: true,
    },
    passwordSiakad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    progdi_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sales_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Customer.associate = function (models) {
    Customer.hasMany(models.Transaction, {
      foreignKey: "customerId",
      as: "transactions",
    });
    Customer.belongsTo(models.User, {
      foreignKey: "sales_id",
      as: "user",
    });
    Customer.belongsTo(models.Progdis, {
      foreignKey: "progdi_id",
      as: "progdi", // Match the alias used in controller
    });
    Customer.belongsTo(models.Classes, {
      foreignKey: "class_id",
      as: "class", // Match the alias used in controller
    });
  };

  return Customer;
};
