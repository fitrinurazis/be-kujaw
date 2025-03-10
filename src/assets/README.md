# Assets Directory

Place your logo file here named `logo.png` for use in PDF reports.

## Logo Requirements

- File should be named `logo.png`
- PNG format with transparent background is recommended
- Optimal dimensions: 300-400px width, aspect ratio preserved
- Maximum file size: 500KB

Example:

```
[Place your logo image here]
```

````

## 9. Modifikasi `src/utils/fileHandlers/downloadHandler.js` (jika belum ada)

```javascript:src\utils\fileHandlers\downloadHandler.js
const fs = require("fs");
const path = require("path");

/**
 * Handle file download and cleanup after response
 * @param {string} filePath - Path to file to be downloaded
 * @param {object} res - Express response object
 */
const handleFileDownload = async (filePath, res) => {
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader("Content-Length", fileStats.size);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Set content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
    } else if (ext === ".xlsx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } else {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after response
    fileStream.on("end", () => {
      // Wait a bit to ensure file is fully sent before deletion
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file ${filePath}:`, err);
        });
      }, 1000);
    });

    // Handle errors
    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(500).end();
    });
  } catch (error) {
    console.error("File download error:", error);
    return res.status(500).json({ error: "Failed to download file" });
  }
};

module.exports = { handleFileDownload };
````

## 10. Struktur direktori yang disarankan

```
src/
├── assets/
│   ├── README.md
│   └── logo.png (letakkan logo Anda di sini)
├── controllers/
│   ├── report.controller.js
│   └── reports/
│       ├── exportControllers.js
│       └── reportData.js
├── middlewares/
│   └── auth.js
├── models/
│   └── [model files]
├── routes/
│   └── reportRoutes.js
├── utils/
│   ├── exporters/
│   │   ├── excelExporter.js
│   │   └── pdfExporter.js
│   ├── fileHandlers/
│   │   └── downloadHandler.js
│   └── reportGenerator.js
└── server.js
```
