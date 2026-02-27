const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const deviceId = req.body.deviceId || 'unknown';
    const dir = path.join(__dirname, '..', 'uploads', 'screenshots', deviceId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(jpeg|jpg|png|webp)$/i;
    const allowedMime = /^(image\/(jpeg|jpg|png|webp)|application\/octet-stream)$/;
    const extOk = allowedExt.test(file.originalname);
    const mimeOk = allowedMime.test(file.mimetype);
    if (extOk || mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  },
});

module.exports = upload;
