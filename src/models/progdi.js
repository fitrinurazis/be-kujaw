"use strict";

module.exports = (sequelize, DataTypes) => {
  const Progdi = sequelize.define("Progdis", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  Progdi.associate = function (models) {
    Progdi.hasMany(models.Customer, {
      foreignKey: "progdi_id",
      as: "customers",
    });
  };

  return Progdi;
};
