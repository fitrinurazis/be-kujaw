"use strict";

module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define("TransactionDetail", {
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  TransactionDetail.associate = function (models) {
    TransactionDetail.belongsTo(models.Transaction, {
      foreignKey: "transactionId",
      as: "transaction",
    });
    TransactionDetail.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return TransactionDetail;
};
