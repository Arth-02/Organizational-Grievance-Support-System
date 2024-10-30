const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|mp4|avi|mov|wmv/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      // Check file size based on type
      let maxSize;
      if (/jpeg|jpg|png/.test(file.mimetype)) {
        maxSize = 2 * 1024 * 1024; // 2MB for images
      } else if (/pdf/.test(file.mimetype)) {
        maxSize = 5 * 1024 * 1024; // 5MB for PDFs
      } else if (/mp4|avi|mov|wmv/.test(file.mimetype)) {
        maxSize = 25 * 1024 * 1024; // 25MB for videos
      }
      if (file.size > maxSize) {
        return cb(
          new Error(
            `Error: File size exceeds the limit of ${
              maxSize / (1024 * 1024)
            }MB for ${file.mimetype} files!`
          )
        );
      }
      return cb(null, true);
    } else {
      return cb(new Error("Error: Only images, PDFs, and videos are allowed!"));
    }
  },
});

module.exports = upload;
