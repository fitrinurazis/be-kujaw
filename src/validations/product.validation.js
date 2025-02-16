const yup = require("yup");

const productSchema = yup.object({
  name: yup.string().required("Product name is required"),
  description: yup.string(),
  price: yup
    .number()
    .positive("Price must be positive")
    .required("Price is required"),
  categoryId: yup.number().required("Category is required"),
});

module.exports = { productSchema };
