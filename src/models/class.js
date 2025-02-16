"use strict";

module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define("Classes", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  Class.associate = function (models) {
    Class.hasMany(models.Customer, {
      foreignKey: "class_id",
      as: "customers",
    });
  };

  return Class;
};
