"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Customers",
          key: "id",
        },
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      proofImage: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.ENUM("pemasukan", "pengeluaran"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("menunggu", "diproses", "selesai"),
        allowNull: false,
        defaultValue: "menunggu",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Transactions");
  },
};
