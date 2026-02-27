# How to Run — Shamil System

## Prerequisites
- Node.js v18+
- MongoDB v6+ (running locally)
- Flutter v3.10+
- Android SDK (for building APK)

---

## Step 1: Start MongoDB

```bash
mongod
```

MongoDB must be running on `localhost:27017` (default).

---

## Step 2: Start Backend

```bash
cd backend

# First time only — install dependencies
npm install

# First time only — create admin user
npm run seed
# Creates: admin@shamil.system / admin123

# Start the server
npm start
```

Server runs on **http://localhost:3000**

---

## Step 3: Start Admin Panel

```bash
cd admin_panel

# First time only — install dependencies
npm install

# Start dev server
npm run dev
```

Opens on **http://localhost:5173**

Login with:
- Email: `admin@shamil.system`
- Password: `admin123`

---

## Step 4: Build & Install Android Client

### Update Server URL

Edit `android_client/lib/core/constants.dart`:

```dart
// For emulator (connects to host machine):
static const String baseUrl = 'http://10.0.2.2:3000';

// For physical device (use your computer's WiFi IP):
static const String baseUrl = 'http://192.168.x.x:3000';
```

To find your IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

### Build

```bash
cd android_client

# First time only
flutter pub get

# Run on connected device/emulator
flutter run

# Or build release APK
flutter build apk --release
```

APK output: `android_client/build/app/outputs/flutter-apk/app-release.apk`

### On the Android Device

1. Open the app and register a new account
2. Tap **"Register This Device"**
3. Tap **"Grant Screen Capture Permission"** and allow it
4. The device will appear as **Online** in the admin panel

---

## Quick Start (All Commands)

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Backend
cd backend && npm install && npm run seed && npm start

# Terminal 3 — Admin Panel
cd admin_panel && npm install && npm run dev

# Terminal 4 — Android Client
cd android_client && flutter pub get && flutter run
```

---

## Environment Config

Backend environment variables in `backend/.env`:

| Variable    | Default                                 | Description            |
|-------------|-----------------------------------------|------------------------|
| PORT        | 3000                                    | API server port        |
| MONGODB_URI | mongodb://localhost:27017/shamil_system | MongoDB connection     |
| JWT_SECRET  | (change in production)                  | JWT signing secret key |
