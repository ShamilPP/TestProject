const express = require('express');
const Device = require('../models/Device');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/devices - List all devices (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const devices = await Device.find().populate('userId', 'name email').sort('-lastActive');
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/devices/:id - Get single device
router.get('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('userId', 'name email');
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/devices/register - Register a new device (client)
router.post('/register', auth, async (req, res) => {
  try {
    const { deviceName, model } = req.body;

    // Check if user already has a device registered
    let device = await Device.findOne({ userId: req.user._id });
    if (device) {
      // Update existing device
      device.deviceName = deviceName || device.deviceName;
      device.model = model || device.model;
      device.lastActive = new Date();
      await device.save();
      return res.json({ device, message: 'Device updated' });
    }

    device = new Device({
      userId: req.user._id,
      deviceName,
      model,
    });
    await device.save();

    res.status(201).json({ device });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/devices/:id/status - Update device status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status, lastActive: new Date() },
      { new: true }
    );
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
