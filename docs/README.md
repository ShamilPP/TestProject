# Shamil System

Internal device monitoring and OCR system. Allows an admin to remotely request screenshots from connected Android devices, extract text via OCR, and view results in a web dashboard — all in real time.

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Admin Web Panel    │◄──────►│   Node.js + Express Backend  │
│   (React + Vite)     │  REST  │   - MongoDB (data storage)   │
│                      │  + WS  │   - Local disk (screenshots) │
└─────────────────────┘         │   - Socket.IO (real-time)    │
                                │   - JWT (authentication)     │
                                └──────────────┬───────────────┘
                                               │ Socket.IO
                                               ▼
                                ┌──────────────────────────────┐
                                │   Android Client App         │
                                │   (Flutter + Native Kotlin)  │
                                │   - MediaProjection capture  │
                                │   - ML Kit OCR               │
                                │   - Background service       │
                                └──────────────────────────────┘
```

---

## Tech Stack

| Component        | Technology                                      |
|------------------|------------------------------------------------|
| Backend          | Node.js, Express, MongoDB, Mongoose, Socket.IO |
| Authentication   | JWT (jsonwebtoken + bcryptjs)                  |
| File Storage     | Local disk via Multer                          |
| Admin Panel      | React.js, Vite, Axios, Socket.IO Client        |
| Android Client   | Flutter, Native Kotlin (MediaProjection)       |
| OCR              | Google ML Kit Text Recognition                 |
| Real-time Comms  | Socket.IO (WebSocket)                          |

---

## Prerequisites

Before running the project, make sure you have installed:

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** v6+ — https://www.mongodb.com/try/download/community
- **Flutter** v3.10+ — https://flutter.dev/docs/get-started/install
- **Android SDK** — included with Android Studio
- **Git** (optional)

---

## How to Run

### 1. Start MongoDB

Make sure MongoDB is running locally on the default port (27017).

```bash
# If installed as a service, it may already be running.
# Otherwise start it manually:
mongod
```

### 2. Start the Backend

```bash
cd backend

# Install dependencies (first time only)
npm install

# Create the initial admin user (first time only)
npm run seed
# Output:
#   Admin user created:
#     Email: admin@shamil.system
#     Password: admin123

# Start the server
npm start
# Output: Server running on port 3000
```

The backend will be available at `http://localhost:3000`.

**Environment variables** (edit `backend/.env` if needed):

| Variable      | Default                                    | Description              |
|---------------|--------------------------------------------|--------------------------|
| PORT          | 3000                                       | Server port              |
| MONGODB_URI   | mongodb://localhost:27017/shamil_system    | MongoDB connection string|
| JWT_SECRET    | shamil_system_jwt_secret_key_2024_change_in_production | Secret for signing JWTs  |

### 3. Start the Admin Panel

```bash
cd admin_panel

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
# Output: Local: http://localhost:5173/
```

Open `http://localhost:5173` in your browser and login with:
- **Email:** `admin@shamil.system`
- **Password:** `admin123`

### 4. Build and Install the Android Client

**Important:** Before building, update the server URL in `android_client/lib/core/constants.dart`:

```dart
// For Android emulator connecting to host machine:
static const String baseUrl = 'http://10.0.2.2:3000';

// For physical device on same WiFi network:
// Replace with your computer's local IP (e.g. 192.168.1.100)
static const String baseUrl = 'http://YOUR_COMPUTER_IP:3000';
```

Then build and install:

```bash
cd android_client

# Get dependencies (first time only)
flutter pub get

# Run on connected device or emulator
flutter run

# Or build a release APK
flutter build apk --release
# APK location: build/app/outputs/flutter-apk/app-release.apk
```

On the Android app:
1. Register a new account (it will be created as a "client" role)
2. Tap "Register This Device"
3. Tap "Grant Screen Capture Permission" and allow it

---

## How It Works

### End-to-End Flow

```
Step 1: Admin opens web dashboard → logs in
Step 2: Admin goes to Devices page → sees connected devices
Step 3: Admin clicks "Request Screenshot" on an online device
          │
          ▼
Step 4: Backend creates a ScreenshotRequest document in MongoDB
        Backend finds the device's Socket.IO connection
        Backend emits "take_screenshot" event to the device
          │
          ▼
Step 5: Android client receives the socket event
        Starts foreground service (ScreenCaptureService)
        MediaProjection captures the screen → PNG bytes
          │
          ▼
Step 6: ML Kit OCR processes the image → extracted text
          │
          ▼
Step 7: Android client uploads the image + text to:
        POST /api/screenshots/upload (multipart form)
        Backend saves the image file to disk
        Backend creates a Screenshot document in MongoDB
          │
          ▼
Step 8: Backend emits "screenshot_ready" to all admin sockets
        Admin dashboard receives the event → UI updates in real time
        Admin sees the screenshot image + OCR text
```

### Device Online/Offline Detection

- When the Android client connects via Socket.IO → device status set to **"online"**
- A heartbeat is sent every 60 seconds to keep the connection alive
- When the socket disconnects → device status set to **"offline"**
- Status changes are broadcast to admins in real time

### Screenshot Capture (Android Native)

The screenshot is captured using Android's **MediaProjection API** inside a foreground service:

1. User grants screen capture permission (one-time consent dialog)
2. A `VirtualDisplay` mirrors the screen to an `ImageReader`
3. The `ImageReader` captures a frame as an RGBA bitmap
4. The bitmap is converted to PNG bytes
5. Bytes are passed back to Flutter via a `MethodChannel`

This requires a **foreground service** with `mediaProjection` type (mandatory on Android 10+).

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header (except login/register).

### Auth

| Method | Endpoint             | Body                                    | Description         |
|--------|----------------------|-----------------------------------------|---------------------|
| POST   | /api/auth/register   | { name, email, password, role? }        | Create new user     |
| POST   | /api/auth/login      | { email, password }                     | Login, returns JWT  |
| GET    | /api/auth/me         | —                                       | Get current user    |

### Devices

| Method | Endpoint                  | Body                    | Description              |
|--------|---------------------------|-------------------------|--------------------------|
| GET    | /api/devices              | —                       | List all devices (admin) |
| GET    | /api/devices/:id          | —                       | Get single device        |
| POST   | /api/devices/register     | { deviceName, model }   | Register device (client) |
| PUT    | /api/devices/:id/status   | { status }              | Update device status     |

### Screenshots

| Method | Endpoint                   | Body / Params                               | Description                |
|--------|----------------------------|---------------------------------------------|----------------------------|
| GET    | /api/screenshots           | ?deviceId=&page=&limit=                     | List screenshots (admin)   |
| GET    | /api/screenshots/:id       | —                                           | Get single screenshot      |
| POST   | /api/screenshots/upload    | multipart: screenshot file + deviceId + requestId + extractedText | Upload screenshot (client) |
| DELETE | /api/screenshots/:id       | —                                           | Delete screenshot (admin)  |

### Screenshot Requests

| Method | Endpoint                   | Body             | Description                          |
|--------|----------------------------|------------------|--------------------------------------|
| POST   | /api/requests              | { deviceId }     | Request screenshot from device (admin)|
| GET    | /api/requests/:deviceId    | —                | Get pending requests (polling fallback)|

### Socket.IO Events

**Admin receives:**
| Event                  | Data                                     | When                        |
|------------------------|------------------------------------------|-----------------------------|
| device:status_changed  | { deviceId, status, lastActive }         | Device goes online/offline  |
| screenshot_ready       | { screenshot: { ...full document... } }  | New screenshot uploaded     |

**Device receives:**
| Event             | Data                        | When                              |
|-------------------|-----------------------------|-----------------------------------|
| take_screenshot   | { requestId, deviceId }     | Admin requests a screenshot       |

---

## Database Schema (MongoDB)

### users
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: "admin" | "client",
  createdAt: Date
}
```

### devices
```
{
  _id: ObjectId,
  userId: ObjectId (ref → users),
  deviceName: String,
  model: String,
  status: "online" | "offline",
  socketId: String | null,
  lastActive: Date,
  createdAt: Date
}
```

### screenshots
```
{
  _id: ObjectId,
  deviceId: ObjectId (ref → devices),
  requestId: ObjectId (ref → screenshot_requests),
  imagePath: String (relative path on disk),
  imageUrl: String (full URL to download),
  extractedText: String,
  status: "processing" | "completed" | "failed",
  createdAt: Date
}
```

### screenshot_requests
```
{
  _id: ObjectId,
  deviceId: ObjectId (ref → devices),
  requestedBy: ObjectId (ref → users),
  status: "pending" | "sent" | "completed" | "failed",
  createdAt: Date
}
```

---

## Project Structure

```
ShamilSystem/
├── backend/                          # Node.js API server
│   ├── server.js                     # Entry point
│   ├── seed.js                       # Admin user seeder
│   ├── .env                          # Environment variables
│   ├── config/db.js                  # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication
│   │   └── upload.js                 # Multer file upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Device.js
│   │   ├── Screenshot.js
│   │   └── ScreenshotRequest.js
│   ├── routes/
│   │   ├── auth.js                   # /api/auth/*
│   │   ├── devices.js                # /api/devices/*
│   │   ├── screenshots.js            # /api/screenshots/*
│   │   └── requests.js               # /api/requests/*
│   ├── socket/
│   │   └── socketHandler.js          # Socket.IO event handlers
│   └── uploads/screenshots/          # Stored screenshot files
│
├── admin_panel/                      # React web dashboard
│   └── src/
│       ├── main.jsx                  # Entry point
│       ├── App.jsx                   # Router + auth gate
│       ├── context/AuthContext.jsx    # Auth state management
│       ├── services/
│       │   ├── api.js                # Axios HTTP client
│       │   └── socket.js             # Socket.IO client
│       ├── components/
│       │   ├── Sidebar.jsx           # Navigation sidebar
│       │   ├── StatCard.jsx          # Dashboard stat card
│       │   └── StatusBadge.jsx       # Online/offline badge
│       └── pages/
│           ├── Login.jsx
│           ├── Layout.jsx            # Sidebar + content shell
│           ├── Dashboard.jsx         # Overview stats
│           ├── Devices.jsx           # Device list
│           ├── DeviceDetail.jsx      # Single device + history
│           ├── Screenshots.jsx       # Screenshot gallery
│           ├── ScreenshotDetail.jsx  # Full image + OCR text
│           └── Settings.jsx          # Account settings
│
├── android_client/                   # Flutter Android app
│   ├── lib/
│   │   ├── main.dart                 # Entry + auth/device gates
│   │   ├── core/
│   │   │   ├── constants.dart        # Server URL, channel name
│   │   │   └── theme.dart            # Dark theme
│   │   ├── services/
│   │   │   ├── api_service.dart      # HTTP client
│   │   │   ├── auth_service.dart     # JWT auth + secure storage
│   │   │   ├── socket_service.dart   # Socket.IO connection
│   │   │   ├── screenshot_service.dart # MethodChannel bridge
│   │   │   ├── ocr_service.dart      # ML Kit text recognition
│   │   │   ├── upload_service.dart   # Multipart upload
│   │   │   └── device_service.dart   # Device registration
│   │   └── features/
│   │       ├── auth/                 # Login screen + provider
│   │       ├── device_registration/  # Registration screen + provider
│   │       ├── screenshot/           # Screenshot pipeline
│   │       ├── background_service/   # Keeps app alive
│   │       └── home/                 # Status dashboard
│   └── android/
│       └── app/src/main/
│           ├── AndroidManifest.xml   # Permissions + service decl
│           └── kotlin/.../
│               ├── MainActivity.kt           # MethodChannel handler
│               └── ScreenCaptureService.kt   # MediaProjection service
│
└── docs/
    └── README.md                     # This file
```

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 rounds) before storage
- All API endpoints (except login/register) require a valid **JWT token**
- Admin-only endpoints check `role === 'admin'` via middleware
- Socket.IO connections are authenticated with JWT on handshake
- File uploads are restricted to image types (jpeg, jpg, png, webp) and 10MB max
- Screenshots are stored on disk and served via Express static middleware

**For production deployment:**
1. Change `JWT_SECRET` in `.env` to a strong random value
2. Change the default admin password after first login
3. Use HTTPS (reverse proxy with nginx/caddy)
4. Restrict CORS origins in `server.js`
5. Enable MongoDB authentication
6. Set `NODE_ENV=production`

---

## Troubleshooting

**Backend won't start:**
- Check that MongoDB is running: `mongosh` should connect
- Check `.env` values, especially `MONGODB_URI`

**Admin panel can't connect:**
- Make sure backend is running on port 3000
- Check browser console for CORS or network errors

**Android app can't reach server:**
- For emulator: use `http://10.0.2.2:3000` (maps to host localhost)
- For physical device: use your computer's local IP (e.g. `http://192.168.1.100:3000`)
- Make sure both are on the same WiFi network
- Make sure your firewall allows incoming connections on port 3000

**Screenshot capture fails:**
- User must grant the MediaProjection consent dialog
- The app must be in the foreground when first granting permission
- Android 14+ requires `FOREGROUND_SERVICE_MEDIA_PROJECTION` permission (already declared)

**OCR returns empty text:**
- ML Kit requires the first run to download models (~5MB)
- Ensure the device has internet for the initial model download
