const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceName: { type: String, required: true, trim: true },
  model: { type: String, trim: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  socketId: { type: String, default: null },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Device', deviceSchema);
