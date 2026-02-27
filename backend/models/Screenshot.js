const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenshotRequest' },
  imagePath: { type: String, required: true },
  imageUrl: { type: String, required: true },
  extractedText: { type: String, default: '' },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Screenshot', screenshotSchema);
