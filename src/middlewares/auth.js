const jwt = require("jsonwebtoken");
const { User } = require("../models");
const redisClient = require("../config/redis");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate" });
  }
};

const adminOnly = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { auth, adminOnly };
