const express = require("express");
const { auth, adminOnly } = require("../middlewares/auth");
const customerController = require("../controllers/customer.controller");

const router = express.Router();

router.get("/", auth, (req, res) => {
  customerController.getAllCustomers(req, res);
});

router.get("/:id", auth, (req, res) => {
  customerController.getCustomerById(req, res);
});

router.post("/", auth, (req, res) => {
  customerController.createCustomer(req, res);
});

router.put("/:id", auth, (req, res) => {
  customerController.updateCustomer(req, res);
});

router.delete("/:id", auth, adminOnly, (req, res) => {
  customerController.deleteCustomer(req, res);
});

router.get("/:id/transactions", auth, (req, res) => {
  customerController.getCustomerTransactions(req, res);
});

module.exports = router;
