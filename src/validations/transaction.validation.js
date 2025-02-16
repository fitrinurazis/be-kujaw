const yup = require("yup");

const transactionSchema = yup.object({
  customerId: yup.number().required("Customer is required"),
  userId: yup.number().required("Sales person is required"),
  description: yup.string(),
  type: yup
    .string()
    .oneOf(["income", "expense"])
    .required("Transaction type is required"),
  details: yup
    .array()
    .of(
      yup.object({
        productId: yup.number().required("Product is required"),
        quantity: yup
          .number()
          .positive("Quantity must be positive")
          .required("Quantity is required"),
      })
    )

    .min(1, "At least one product is required"),
});
module.exports = { transactionSchema };
