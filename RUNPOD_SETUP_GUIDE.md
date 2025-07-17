# RunPod Unmute Setup Guide

## Current Status
✅ Docker installed
✅ Docker Compose installed  
✅ NVIDIA Container Toolkit installed
❌ Docker daemon startup failed (iptables/networking issues in container)

## Solution: Start Docker with Container-Friendly Flags

### 1. Start Docker Daemon with Proper Configuration
The error you're seeing is because RunPod containers have restricted networking. Try these commands in order:

**Option A - Basic container-friendly setup:**
```bash
# Kill any existing Docker processes
pkill dockerd 2>/dev/null || true

# Start Docker daemon with container-friendly settings
dockerd --host=unix:///var/run/docker.sock --iptables=false --storage-driver=vfs &

# Wait for daemon to start
sleep 10

# Test Docker is working
docker --version
docker ps
```

**Option B - If Option A fails, try with more restrictions:**
```bash
# Kill any existing Docker processes
pkill dockerd 2>/dev/null || true

# Start with minimal networking and bridge disabled
dockerd --iptables=false --bridge=none --storage-driver=vfs &

# Wait for daemon to start
sleep 10

# Test Docker is working
docker ps
```

### 2. Test NVIDIA GPU Access
```bash
# Test NVIDIA Container Toolkit
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

### 3. Set Up Hugging Face Token
```bash
# Add your Hugging Face token to environment
export HUGGING_FACE_HUB_TOKEN=hf_your_token_here

# Add to bashrc for persistence
echo 'export HUGGING_FACE_HUB_TOKEN=hf_your_token_here' >> ~/.bashrc
```

### 4. Clone and Setup Unmute
```bash
# Clone Unmute repository
git clone https://github.com/kyutai-labs/unmute.git
cd unmute

# Start Unmute with Docker Compose
docker compose up --build
```

### 5. Access Unmute
- If running locally: http://localhost
- If accessing remotely: Set up port forwarding via SSH

## Troubleshooting

### If Docker daemon fails to start:
```bash
# Kill any existing Docker processes
pkill dockerd

# Start with verbose logging
dockerd --debug &
```

### If GPU not detected:
```bash
# Check GPU status
nvidia-smi

# Verify NVIDIA runtime
docker info | grep nvidia
```

### Memory Issues:
- Unmute requires ~16GB GPU memory minimum
- Check your RunPod instance has sufficient GPU memory
- Consider using smaller models if needed

## Port Forwarding (if accessing remotely)
```bash
# From your local machine
ssh -N -L 3333:localhost:80 your-runpod-instance
```

Then access at http://localhost:3333