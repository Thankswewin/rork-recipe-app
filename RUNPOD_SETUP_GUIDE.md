# RunPod Unmute Setup Guide

## Current Status
✅ Docker installed
✅ Docker Compose installed  
✅ NVIDIA Container Toolkit installed
❌ Docker daemon needs to be started manually (no systemd)

## Next Steps

### 1. Start Docker Daemon Manually
Since RunPod doesn't use systemd, start Docker manually:
```bash
# Start Docker daemon in background
dockerd &

# Wait a few seconds for it to start
sleep 5

# Test Docker is working
docker --version
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