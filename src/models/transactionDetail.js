"use strict";

module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define("TransactionDetail", {
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: true,
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
    status: {
      type: DataTypes.ENUM("menunggu", "diproses", "selesai"),
      allowNull: false,
      defaultValue: "menunggu",
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
