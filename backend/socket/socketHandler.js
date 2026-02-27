const jwt = require('jsonwebtoken');
const Device = require('../models/Device');

function setupSocketHandlers(io) {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId}, role: ${socket.userRole})`);

    // Admin joins admin room for broadcasts
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
      console.log(`Admin ${socket.userId} joined admin_room`);
    }

    // Device connects and registers its socket
    socket.on('device:connect', async (data) => {
      try {
        const { deviceId } = data;
        const device = await Device.findOneAndUpdate(
          { _id: deviceId, userId: socket.userId },
          { socketId: socket.id, status: 'online', lastActive: new Date() },
          { new: true }
        );

        if (device) {
          socket.deviceId = deviceId;
          console.log(`Device ${deviceId} is now online (socket: ${socket.id})`);

          // Notify admins
          io.to('admin_room').emit('device:status_changed', {
            deviceId,
            status: 'online',
            lastActive: device.lastActive,
          });
        }
      } catch (error) {
        console.error('device:connect error:', error.message);
      }
    });

    // Device heartbeat
    socket.on('device:heartbeat', async () => {
      try {
        if (socket.deviceId) {
          await Device.findByIdAndUpdate(socket.deviceId, {
            lastActive: new Date(),
            status: 'online',
          });
        }
      } catch (error) {
        console.error('heartbeat error:', error.message);
      }
    });

    // Admin requests screenshot from a device
    socket.on('admin:request_screenshot', async (data) => {
      try {
        if (socket.userRole !== 'admin') return;

        const { deviceId, requestId } = data;
        const device = await Device.findById(deviceId);

        if (device && device.socketId) {
          io.to(device.socketId).emit('take_screenshot', {
            requestId,
            deviceId,
          });
          console.log(`Screenshot request ${requestId} sent to device ${deviceId}`);
        }
      } catch (error) {
        console.error('request_screenshot error:', error.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      if (socket.deviceId) {
        try {
          const device = await Device.findByIdAndUpdate(
            socket.deviceId,
            { status: 'offline', socketId: null },
            { new: true }
          );

          if (device) {
            io.to('admin_room').emit('device:status_changed', {
              deviceId: socket.deviceId,
              status: 'offline',
              lastActive: device.lastActive,
            });
            console.log(`Device ${socket.deviceId} is now offline`);
          }
        } catch (error) {
          console.error('disconnect error:', error.message);
        }
      }
    });
  });
}

module.exports = setupSocketHandlers;
