// backend/middleware/upload.js
const multer = require('multer');

// We use memoryStorage because we are uploading to Cloudinary,
// not saving the files on our server.
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

module.exports = upload;