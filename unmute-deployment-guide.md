# Unmute Deployment Guide for RTX 3080

## Prerequisites Check

### System Requirements
- **GPU**: RTX 3080 (16GB VRAM) ✅
- **OS**: Windows 11 with WSL2 Ubuntu
- **Memory**: 32GB+ RAM recommended
- **Storage**: 50GB+ free space

### Step 1: Install WSL2 Ubuntu

```powershell
# Run as Administrator in PowerShell
wsl --install -d Ubuntu
# Restart computer when prompted
```

### Step 2: Install Docker Desktop with WSL2

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. During installation, ensure "Use WSL 2" is checked
3. Start Docker Desktop and enable WSL2 integration

### Step 3: Install NVIDIA Container Toolkit

```bash
# Inside WSL2 Ubuntu
sudo apt update && sudo apt install -y curl
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt update && sudo apt install -y nvidia-docker2
sudo systemctl restart docker
```

### Step 4: Verify GPU Access

```bash
# Test GPU access in Docker
sudo docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

## Unmute Setup

### Step 1: Clone Repository

```bash
# Inside WSL2 Ubuntu
cd ~
git clone https://github.com/kyutai-labs/unmute.git
cd unmute
```

### Step 2: Setup Hugging Face Token

1. Create account at [huggingface.co](https://huggingface.co)
2. Accept [Mistral Small 3.2 24B model](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506)
3. Create access token with "Read access to contents of all public gated repos"
4. Add to environment:

```bash
# Add to ~/.bashrc
echo 'export HUGGING_FACE_HUB_TOKEN=hf_your_token_here' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Configure for RTX 3080

Create `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  llm:
    environment:
      - MODEL=mistralai/Mistral-Small-3.2-24B-Instruct-2506
      - MAX_MODEL_LEN=4096
      - GPU_MEMORY_UTILIZATION=0.8
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  stt:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  tts:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Step 4: Deploy Unmute

```bash
# Start all services
docker compose up --build

# Or run in background
docker compose up -d --build
```

### Step 5: Verify Deployment

1. **Check services**:
   ```bash
   docker compose ps
   ```

2. **Test audio**:
   - Open browser to `http://localhost`
   - Click "Connect" and test voice interaction

3. **Monitor logs**:
   ```bash
   # View all logs
   docker compose logs -f
   
   # View specific service
   docker compose logs -f llm
   ```

## Nigerian Cuisine Configuration

### Step 1: Customize voices.yaml

```yaml
# Edit voices.yaml
cooking_assistant:
  name: "Chef Mama"
  system_prompt: |
    You are Chef Mama, a warm Nigerian grandmother cooking expert.
    Specialties: jollof rice, egusi soup, pounded yam, moin moin, suya, pepper soup.
    Always provide measurements in both metric and Nigerian household units.
    Use encouraging language and share cultural context.
    Understand Yoruba, Igbo, and Hausa cooking terms.
  voice: "female_nigerian"
```

### Step 2: Restart services
```bash
docker compose restart backend
```

## Troubleshooting

### Common Issues

1. **GPU not detected**:
   ```bash
   # Check WSL2 GPU support
   nvidia-smi
   ```

2. **Memory issues**:
   - Reduce `MAX_MODEL_LEN` to 2048
   - Lower `GPU_MEMORY_UTILIZATION` to 0.6

3. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :80
   ```

4. **Permission issues**:
   ```bash
   # Fix Docker permissions
   sudo usermod -aG docker $USER
   ```

## Next Steps

After successful deployment:
1. Test basic voice interaction
2. Configure Nigerian recipe knowledge base
3. Integrate with recipe app via WebSocket
4. Add camera-based cooking guidance

## Quick Commands Reference

```bash
# Start Unmute
docker compose up -d --build

# Stop Unmute
docker compose down

# View logs
docker compose logs -f

# Restart specific service
docker compose restart backend

# Update Unmute
git pull origin main
docker compose up -d --build