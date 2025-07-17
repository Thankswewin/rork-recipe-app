# RunPod React Native App Setup Guide

## Prerequisites Check
Your app needs these installed on RunPod:
- ✅ Node.js (v18+)
- ✅ Bun (package manager)
- ✅ Git

## Step 1: Install Required Software

```bash
# Update system
apt update

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Verify installations
node --version
bun --version
git --version
```

## Step 2: Clone and Setup Your App

```bash
# Clone your app (replace with your actual repo URL)
git clone <your-repo-url> rork-app
cd rork-app

# Install dependencies
bun install

# Copy environment file
cp .env.example .env
```

## Step 3: Configure Environment

Edit your `.env` file with your actual values:
```bash
nano .env
```

Add your Supabase credentials and other required environment variables.

## Step 4: Start Your App

```bash
# Start the development server with tunnel (for external access)
bun run start

# Or start web version specifically
bun run start-web
```

## Step 5: Access Your App

Your app will be available at:
- **Mobile**: Scan the QR code with Expo Go app
- **Web**: The tunnel URL provided in the terminal (something like https://abc123.ngrok.io)

## Port Configuration

If you need to expose specific ports, RunPod allows you to:
1. Go to your RunPod instance dashboard
2. Click "Connect" 
3. Use "TCP Port Mapping" to expose ports externally

For your app, you typically need:
- Port 8081 (Metro bundler)
- Port 19000-19002 (Expo dev tools)

## Troubleshooting

### If bun command not found:
```bash
# Reload bash profile
source ~/.bashrc

# Or install bun again
curl -fsSL https://bun.sh/install | bash
```

### If app won't start:
```bash
# Clear cache and restart
rm -rf node_modules
bun install
bun run start
```

### If tunnel doesn't work:
```bash
# Install ngrok manually
npm install -g @expo/ngrok
bun run start
```

### Database Connection Issues:
Make sure your Supabase URL and keys are correctly set in `.env`

## Running Backend Services

Your app has a backend with tRPC. The backend will start automatically when you run the app, but you can also run it separately:

```bash
# Backend runs on the same process as your Expo app
# Check backend/hono.ts for the server configuration
```

## No Docker Needed!

Unlike the Unmute voice chat feature, your main React Native app doesn't need Docker. It runs directly with Node.js and Bun, making it much simpler to deploy on RunPod.