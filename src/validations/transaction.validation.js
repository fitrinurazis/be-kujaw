const yup = require("yup");

const incomeTransactionSchema = yup.object({
  customerId: yup.number().required("Wajib pilih customer"),
  userId: yup.number().required("Wajib pilih sales"),
  description: yup.string(),
  transactionDate: yup.date().default(() => new Date()),
  details: yup
    .array()
    .of(
      yup.object({
        productId: yup.number().required("Wajib pilih produk"),
        quantity: yup
          .number()
          .positive("Jumlah harus lebih dari 0")
          .required("Jumlah wajib disi"),
      })
    )
    .min(1, "Setidaknya diperlukan satu produk"),
});

const expenseTransactionSchema = yup.object({
  userId: yup.number().required("Wajib pilih sales"),
  description: yup.string(),
  amount: yup.number().required("Jumlah wajib disi"),
  transactionDate: yup.date().default(() => new Date()),
  status: yup
    .string()
    .oneOf(["menunggu", "diproses", "selesai"])
    .default("menunggu"),
  details: yup.array().of(
    yup.object({
      itemName: yup.string().required(),
      quantity: yup.number().required(),
      pricePerUnit: yup.number().required(),
      totalPrice: yup.number().required(),
      status: yup
        .string()
        .oneOf(["menunggu", "diproses", "selesai"])
        .default("menunggu"),
    })
  ),
});

module.exports = {
  incomeTransactionSchema,
  expenseTransactionSchema,
};
