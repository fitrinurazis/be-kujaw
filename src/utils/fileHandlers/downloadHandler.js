const { unlink } = require("fs").promises;

const handleFileDownload = async (filePath, res) => {
  try {
    res.download(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
      }

      // Delete the file after download is complete
      setTimeout(async () => {
        try {
          await unlink(filePath);
          console.log(`Successfully deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting temp file ${filePath}:`, err);
        }
      }, 5000); // Give more time for the download to complete
    });
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error("Download failed: " + error.message);
  }
};

module.exports = { handleFileDownload };
