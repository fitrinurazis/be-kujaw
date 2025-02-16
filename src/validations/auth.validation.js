const yup = require("yup");

const loginSchema = yup.object({
  identifier: yup.string().required(),
  password: yup.string().required().min(6),
});

const registerSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  phone: yup.string(),
  password: yup.string().required().min(6),
  role: yup.string().oneOf(["admin", "sales"]),
});

const changePasswordSchema = yup.object({
  currentPassword: yup.string().required(),
  newPassword: yup.string().required().min(6),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
};
