const express = require('express');
const ScreenshotRequest = require('../models/ScreenshotRequest');
const Device = require('../models/Device');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/requests - Admin creates screenshot request
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { deviceId } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const request = new ScreenshotRequest({
      deviceId,
      requestedBy: req.user._id,
    });
    await request.save();

    // Send via Socket.IO to the target device
    const io = req.app.get('io');
    if (io && device.socketId) {
      io.to(device.socketId).emit('take_screenshot', {
        requestId: request._id.toString(),
        deviceId: deviceId,
      });
      request.status = 'sent';
      await request.save();
    }

    res.status(201).json({ request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/requests/:deviceId - Get pending requests for a device (polling fallback)
router.get('/:deviceId', auth, async (req, res) => {
  try {
    const requests = await ScreenshotRequest.find({
      deviceId: req.params.deviceId,
      status: { $in: ['pending', 'sent'] },
    }).sort('-createdAt');

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
