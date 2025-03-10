require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const docs = require("./docs/route");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Create upload directory if it doesn't exist
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("public/uploads"));
// API Documentation

docs(app);

// Routes
app.use("/api", routes);

// Catch-all route handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found. Please check your URL and try again.",
  });
});

// Error Handler
app.use(errorHandler);

// Start server

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(
      `API Documentation available at http://localhost:${PORT}/api-docs`
    );
  });
}
module.exports = app;
