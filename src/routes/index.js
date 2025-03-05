const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const progdiRoutes = require("./progdiRoutes");
const classRoutes = require("./classRoutes");
const transactionRoutes = require("./transactionRoutes");
const customerRoutes = require("./customerRoutes");
const reportRoutes = require("./reportRoutes");
const userRoutes = require("./userRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const fs = require("fs");
const path = require("path");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/progdis", progdiRoutes);
router.use("/classes", classRoutes);
router.use("/transactions", transactionRoutes);
router.use("/customers", customerRoutes);
router.use("/reports", reportRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
