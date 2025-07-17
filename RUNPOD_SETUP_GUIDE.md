# RunPod Unmute Setup Guide

## Current Status
✅ Docker installed
✅ Docker Compose installed  
✅ NVIDIA Container Toolkit installed
✅ Docker daemon is now running successfully!

## Solution: Fix "unshare: operation not permitted" Error

### 1. Start Docker Daemon with User Namespace Disabled
The error you're seeing is because Docker is trying to use user namespaces which are restricted in RunPod containers. Here's the fix:

**Step 1 - Kill existing Docker and restart with proper flags:**
```bash
# Kill any existing Docker processes
pkill dockerd 2>/dev/null || true
pkill containerd 2>/dev/null || true

# Start Docker daemon with user namespaces disabled
dockerd --storage-driver=vfs --iptables=false --userns-remap="" --disable-legacy-registry=false &

# Wait for daemon to start
sleep 10

# Test Docker is working
docker --version
docker ps
```

**Step 2 - Test with hello-world:**
```bash
# This should now work without the unshare error
docker run --rm hello-world
```

**If Step 1 fails, try this alternative:**
```bash
# Kill any existing Docker processes
pkill dockerd 2>/dev/null || true

# Start with even more restrictions
dockerd --storage-driver=vfs --iptables=false --bridge=none --userns-remap="" &

# Wait for daemon to start
sleep 10

# Test Docker is working
docker run --rm hello-world
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