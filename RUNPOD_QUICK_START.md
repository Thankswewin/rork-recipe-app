# RunPod Quick Start Guide for RORK Recipe App

## 🚀 Immediate Setup Commands

Run these commands in your RunPod terminal:

```bash
# Make the setup script executable and run it
chmod +x runpod-setup.sh
./runpod-setup.sh
```

## 📋 Manual Setup (if script fails)

### 1. Install Node.js and npm
```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget unzip git build-essential

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install Bun (Alternative Package Manager)
```bash
# Install unzip first (required for Bun)
apt install -y unzip

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
```

### 3. Install Project Dependencies
```bash
# Using npm
npm install

# OR using Bun (faster)
bun install
```

### 4. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

### 5. Start the Application
```bash
# Development mode
npm start
# or
bun start

# The app will be available at http://localhost:8081
```

## 🌐 Accessing Your App

### Option 1: RunPod Port Forwarding
1. In RunPod dashboard, click "Connect"
2. Use "HTTP Service" tab
3. Set port to `8081`
4. Access via the provided URL

### Option 2: SSH Tunnel
```bash
# From your local machine
ssh -L 8081:localhost:8081 root@your-runpod-ip
# Then access http://localhost:8081 locally
```

## 🎤 Unmute Voice Assistant Setup

### Prerequisites
```bash
# Install Docker (included in setup script)
apt install -y docker.io docker-compose
systemctl start docker

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt update
apt install -y nvidia-docker2
systemctl restart docker
```

### Deploy Unmute Backend
```bash
# Clone Unmute repository
git clone https://github.com/KoljaB/Unmute.git
cd Unmute

# Create docker-compose.override.yml for GPU support
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  unmute:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility
    ports:
      - "8000:8000"
EOF

# Start Unmute with GPU support
docker compose up --build -d
```

## 🔧 Troubleshooting

### Node.js Issues
```bash
# If npm not found, reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
```

### Bun Issues
```bash
# Ensure unzip is installed
apt install -y unzip

# Reinstall Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### GPU Issues
```bash
# Check GPU availability
nvidia-smi

# Test Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### Port Issues
```bash
# Check what's running on port 8081
lsof -i :8081

# Kill process if needed
kill -9 <PID>
```

## 📱 App Features Available

✅ **Ready to Use:**
- Recipe browsing and search
- User authentication
- Chef assistant chat
- Voice chat interface
- Real-time messaging
- Notifications system

🎤 **With Unmute Setup:**
- Voice conversations with Chef Mama
- Nigerian cuisine expertise
- Real-time voice responses
- GPU-accelerated AI processing

## 🔗 Important Files

- `UNMUTE_INTEGRATION_GUIDE.md` - Complete Unmute setup
- `TODO.md` - Project status and next steps
- `.env.example` - Environment variables template
- `package.json` - Project dependencies

## 💡 Pro Tips

1. **Use Bun for faster installs**: `bun install` instead of `npm install`
2. **Monitor GPU usage**: `watch nvidia-smi`
3. **Check logs**: `docker logs unmute_unmute_1`
4. **Restart services**: `docker compose restart`
5. **Update code**: `git pull && npm install && npm start`

Your RunPod is now ready to run the RORK Recipe App with full voice assistant capabilities! 🚀