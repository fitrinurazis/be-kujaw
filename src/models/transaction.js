"use strict";

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    proofImage: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
  });

  Transaction.associate = function (models) {
    Transaction.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Transaction.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    Transaction.hasMany(models.TransactionDetail, {
      foreignKey: "transactionId",
      as: "details",
    });
  };

  return Transaction;
};
