const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Base upload directory
const uploadBasePath = path.join(__dirname, "../../public/uploads");

// Create upload directories if they don't exist
const createDirectories = () => {
  const dirs = ["proofs", "avatars", "temp"];

  // Create main upload directory if it doesn't exist
  if (!fs.existsSync(uploadBasePath)) {
    fs.mkdirSync(uploadBasePath, { recursive: true });
  }

  // Create subdirectories
  dirs.forEach((dir) => {
    const dirPath = path.join(uploadBasePath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

createDirectories();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = uploadBasePath;

    // Determine subdirectory based on file type
    if (file.fieldname === "proofImage") {
      uploadDir = path.join(uploadBasePath, "proofs");
    } else if (file.fieldname === "avatar") {
      uploadDir = path.join(uploadBasePath, "avatars");
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// File cleanup middleware
const cleanupFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
    }
  });

  next();
};

module.exports = {
  upload,
  cleanupFiles,
};
