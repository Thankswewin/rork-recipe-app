# Unmute Deployment Checklist

## Pre-Deployment Checklist

### System Verification
- [ ] Windows 11 with WSL2 installed
- [ ] RTX 3080 with latest drivers
- [ ] 32GB+ RAM available
- [ ] 50GB+ free disk space

### Docker Setup
- [ ] Docker Desktop installed with WSL2 integration
- [ ] NVIDIA Container Toolkit installed
- [ ] GPU access verified with `nvidia-smi`

### Hugging Face Setup
- [ ] Hugging Face account created
- [ ] Mistral Small 3.2 24B model accepted
- [ ] Access token created with read permissions
- [ ] Token added to environment variables

## Deployment Steps

### Step 1: Environment Setup
```bash
# Run these commands in WSL2 Ubuntu
cd ~
git clone https://github.com/kyutai-labs/unmute.git
cd unmute
```

### Step 2: Configuration
- [ ] Create `docker-compose.override.yml` for RTX 3080
- [ ] Add Hugging Face token to environment
- [ ] Configure Nigerian cuisine system prompts

### Step 3: Deployment
```bash
# Start Unmute
docker compose up --build

# Verify services
docker compose ps
```

### Step 4: Testing
- [ ] Access http://localhost in browser
- [ ] Test voice connection
- [ ] Verify Nigerian recipe knowledge
- [ ] Check GPU utilization

## Troubleshooting Commands

### GPU Issues
```bash
# Check GPU in WSL
nvidia-smi

# Check Docker GPU access
sudo docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### Memory Issues
```bash
# Monitor memory usage
docker stats

# Check logs for memory errors
docker compose logs llm | grep -i memory
```

### Service Issues
```bash
# Restart all services
docker compose restart

# View specific service logs
docker compose logs -f backend
```

## Post-Deployment Verification

### Voice Features Test
- [ ] Basic conversation works
- [ ] Nigerian dish recognition
- [ ] Cooking guidance responses
- [ ] Multi-language support (Yoruba/Igbo/Hausa terms)

### Performance Check
- [ ] Response time under 2 seconds
- [ ] GPU memory usage under 80%
- [ ] Audio quality clear
- [ ] No dropped connections

## Integration Ready Checklist

Before connecting to recipe app:
- [ ] Unmute backend running on localhost:8000
- [ ] WebSocket connection tested
- [ ] Nigerian cuisine knowledge base loaded
- [ ] Voice quality optimized for cooking guidance

## Quick Commands

```bash
# Start Unmute
docker compose up -d --build

# Stop Unmute
docker compose down

# View logs
docker compose logs -f

# Update
git pull origin main && docker compose up -d --build