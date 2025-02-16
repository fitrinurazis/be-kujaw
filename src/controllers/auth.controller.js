const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/redis");
const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} = require("../validations/auth.validation");

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const authController = {
  register: async (req, res) => {
    try {
      const validatedData = await registerSchema.validate(req.body);

      const user = await User.create({
        ...validatedData,
        avatar: req.file?.filename || "avatar.jpg", // Set default if no file uploaded
      });
      const token = generateToken(user);

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const validatedData = await loginSchema.validate(req.body);
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: validatedData.identifier },
            { phone: validatedData.identifier },
          ],
        },
      });

      if (!user || !(await user.validatePassword(validatedData.password))) {
        throw new Error("Invalid credentials");
      }

      const token = generateToken(user);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  getProfile: (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      avatar: req.user.avatar,
    });
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } =
        await changePasswordSchema.validate(req.body);

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      if (!req.token) {
        return res.status(400).json({ error: "No token provided" });
      }

      // Convert JWT_EXPIRES_IN from string to seconds if it's in format like '24h'
      const expirySeconds = parseInt(process.env.JWT_EXPIRES_IN) || 86400; // default 24h

      // Store token in blacklist
      await redisClient.set(`bl_${req.token}`, "true", "EX", expirySeconds);

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed", details: error.message });
    }
  },
};

module.exports = authController;
