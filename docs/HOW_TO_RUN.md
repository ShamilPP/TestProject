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

| Variable    | Value                  | Description            |
|-------------|------------------------|------------------------|
| PORT        | 5677                   | API server port        |
| MONGODB_URI | (MongoDB Atlas URI)    | MongoDB Atlas connection|
| JWT_SECRET  | (change in production) | JWT signing secret key |
| NODE_ENV    | production             | Enables prod settings  |

---

## Deploying to AWS EC2 (Production)

**Server:** `13.60.80.239` | **Port:** `5677`

### EC2 Setup (run once on the server)

```bash
# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 globally
sudo npm install -g pm2

# 3. Allow port 5677 through firewall (also open in EC2 Security Group)
sudo ufw allow 5677

# 4. Clone / upload the backend folder to EC2
#    e.g. using scp:
scp -r ./backend ec2-user@13.60.80.239:~/shamil-system/

# 5. Install dependencies on EC2
cd ~/shamil-system/backend
npm install

# 6. Create .env on EC2 (copy your local .env)
nano .env   # paste the contents

# 7. Seed the admin user (first time only)
npm run seed

# 8. Start with PM2
npm run pm2:start
# or directly:
pm2 start ecosystem.config.js --env production

# 9. Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup    # follow the printed instruction
```

### PM2 Management Commands (on EC2)

```bash
pm2 status                  # see running apps
pm2 logs shamil-system      # live logs
pm2 restart shamil-system   # restart after code change
pm2 stop shamil-system      # stop
pm2 delete shamil-system    # remove from PM2
```

### Deploy Admin Panel to EC2

```bash
# Build locally
cd admin_panel
npm run build
# dist/ folder is created

# Upload dist/ to EC2
scp -r ./dist ec2-user@13.60.80.239:~/shamil-system/admin_panel/

# On EC2: serve with nginx or a simple static server
# Option A — nginx (recommended)
sudo apt install nginx
# Put dist/ contents in /var/www/html

# Option B — serve with Node (quick)
npm install -g serve
serve -s dist -l 80
```

### Build Android APK for Production

The APK is already configured to point to `http://13.60.80.239:5677`.

```bash
cd android_client
flutter build apk --release
```

APK: `android_client/build/app/outputs/flutter-apk/app-release.apk`

### EC2 Security Group — Required Inbound Rules

| Type       | Port | Source    |
|------------|------|-----------|
| Custom TCP | 5677 | 0.0.0.0/0 |
| HTTP       | 80   | 0.0.0.0/0 |
| SSH        | 22   | Your IP   |
