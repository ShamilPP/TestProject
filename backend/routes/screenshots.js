const express = require('express');
const fs = require('fs');
const path = require('path');
const Screenshot = require('../models/Screenshot');
const ScreenshotRequest = require('../models/ScreenshotRequest');
const { auth, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/screenshots - List screenshots (filterable by deviceId)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.deviceId) {
      filter.deviceId = req.query.deviceId;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [screenshots, total] = await Promise.all([
      Screenshot.find(filter)
        .populate('deviceId', 'deviceName model')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Screenshot.countDocuments(filter),
    ]);

    res.json({ screenshots, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/screenshots/:id - Get single screenshot
router.get('/:id', auth, async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id).populate(
      'deviceId',
      'deviceName model'
    );
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    res.json({ screenshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/screenshots/upload - Client uploads screenshot + OCR text
router.post('/upload', auth, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file provided' });
    }

    const { deviceId, requestId, extractedText, ocrBlocks } = req.body;
    const relativePath = path.relative(
      path.join(__dirname, '..'),
      req.file.path
    ).replace(/\\/g, '/');

    const imageUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

    const screenshot = new Screenshot({
      deviceId,
      requestId: requestId || null,
      imagePath: relativePath,
      imageUrl,
      extractedText: extractedText || '',
      ocrBlocks: ocrBlocks ? JSON.parse(ocrBlocks) : [],
      status: 'completed',
    });
    await screenshot.save();

    // Update request status if requestId provided
    if (requestId) {
      await ScreenshotRequest.findByIdAndUpdate(requestId, { status: 'completed' });
    }

    // Populate device info before emitting
    await screenshot.populate('deviceId', 'deviceName model');

    // Emit to admin via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('screenshot_ready', { screenshot });
    }

    res.status(201).json({ screenshot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/screenshots/:id - Admin deletes screenshot
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', screenshot.imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Screenshot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Screenshot deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
