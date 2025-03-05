"use strict";

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Change this to true
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
      type: DataTypes.ENUM("pemasukan", "pengeluaran"),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("menunggu", "diproses", "selesai"),
      allowNull: false,
      defaultValue: "menunggu",
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
