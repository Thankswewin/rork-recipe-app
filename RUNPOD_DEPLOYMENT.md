# RunPod Unmute.sh Deployment Instructions

## Prerequisites
1. RunPod account with GPU credits
2. Basic familiarity with RunPod interface
3. SSH client (built into Windows 10/11)

## Step 1: Create RunPod Instance

1. Go to [RunPod.io](https://runpod.io) and sign in
2. Click "Deploy" â†’ "GPU Pods"
3. Choose a GPU instance (recommended: RTX 4090 or A100)
4. Select template: "PyTorch 2.1" or "CUDA Development"
5. Configure:
   - Container Disk: 50GB minimum
   - Volume: 20GB (optional, for model storage)
   - Ports: 8000, 80 (HTTP), 22 (SSH)
6. Click "Deploy On-Demand"

## Step 2: Connect to Your Pod

1. Wait for pod to be "Running"
2. Click "Connect" â†’ "SSH Terminal"
3. Copy the SSH command (looks like: `ssh root@pod-id.proxy.runpod.net`)
4. Open PowerShell/Terminal and run the SSH command

## Step 3: Deploy Unmute.sh

1. Upload the setup script:
   ```bash
   # In your SSH session:
   wget https://raw.githubusercontent.com/your-repo/runpod-setup.sh
   chmod +x runpod-setup.sh
   ./runpod-setup.sh
   ```

   OR manually copy the script content and save as `runpod-setup.sh`

2. The script will:
   - Install all dependencies
   - Clone unmute.sh repository
   - Configure for Nigerian cuisine chat
   - Set up Docker containers
   - Start the services

## Step 4: Get Your Connection URLs

After successful deployment, you'll see:
```
ðŸ”— Connection URLs:
  WebSocket: ws://your-pod-id:80/ws
  HTTP API:  http://your-pod-id:80
```

## Step 5: Configure Your App

1. Open your React Native app
2. Go to Settings â†’ Unmute Configuration
3. Enter the WebSocket URL: `ws://your-pod-id-8000.proxy.runpod.net/ws`
4. Test the connection

## Management Commands

Once deployed, use these commands in your SSH session:

```bash
# Start services
./start-unmute.sh

# Stop services
./stop-unmute.sh

# View logs
./logs-unmute.sh

# Check status
docker-compose -f docker-compose.runpod.yml ps
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
./logs-unmute.sh

# Restart services
./stop-unmute.sh
./start-unmute.sh
```

### Connection Issues
1. Verify pod is running in RunPod dashboard
2. Check if ports 8000 and 80 are exposed
3. Test connection: `curl http://localhost:8000/health`

### GPU Issues
```bash
# Check GPU availability
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
```

## Cost Optimization

1. **Stop when not in use**: Always stop your pod when not actively using it
2. **Use Spot instances**: Cheaper but can be interrupted
3. **Monitor usage**: Check RunPod dashboard for credit usage
4. **Right-size GPU**: Start with smaller GPU, upgrade if needed

## Security Notes

1. **Change default passwords**: If using persistent storage
2. **Use SSH keys**: More secure than password authentication
3. **Firewall**: Only expose necessary ports
4. **Regular updates**: Keep system and dependencies updated

## Support

If you encounter issues:
1. Check the logs: `./logs-unmute.sh`
2. Verify GPU access: `nvidia-smi`
3. Test local connection: `curl http://localhost:8000/health`
4. Check RunPod status dashboard

For app-specific issues, check the React Native app logs and Unmute configuration.
