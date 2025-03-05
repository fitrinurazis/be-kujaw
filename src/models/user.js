"use strict";
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: DataTypes.STRING,
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "sales"),
        defaultValue: "sales",
      },
      avatar: {
        type: DataTypes.STRING,
        defaultValue: "avatar.jpg",
      },
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.associate = function (models) {
    User.hasMany(models.Transaction, {
      foreignKey: "userId",
      as: "transactions",
    });
    User.hasMany(models.Customer, {
      foreignKey: "sales_id",
      as: "customers",
    });
  };

  return User;
};
