# RunPod Unmute Setup Guide

This guide will help you set up Unmute on RunPod and connect it to your React Native app.

## Step 1: RunPod Setup

### 1.1 Connect to your RunPod instance
- Click "Connect" in your RunPod dashboard
- You should see a terminal/Jupyter interface

### 1.2 Install required dependencies
```bash
# Update system
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### 1.3 Test NVIDIA Docker setup
```bash
sudo docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```
This should show your GPU information.

### 1.4 Set up Hugging Face token
1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Accept the conditions for [Mistral Small 3.2 24B](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506)
3. Create a token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
4. Set the token in your environment:

```bash
export HUGGING_FACE_HUB_TOKEN=hf_your_token_here
echo 'export HUGGING_FACE_HUB_TOKEN=hf_your_token_here' >> ~/.bashrc
```

## Step 2: Clone and Start Unmute

### 2.1 Clone the repository
```bash
git clone https://github.com/kyutai-labs/unmute.git
cd unmute
```

### 2.2 Start Unmute with Docker Compose
```bash
# Make sure your token is set
echo $HUGGING_FACE_HUB_TOKEN

# Start Unmute (this will take a while on first run)
docker compose up --build
```

Wait for all services to start. You should see logs indicating that the services are running.

## Step 3: Get your RunPod URL

### 3.1 Find your public URL
RunPod provides public URLs for your services. Look for:
- **HTTP URL**: Usually in format `https://your-pod-id-8000.proxy.runpod.net`
- **WebSocket URL**: Convert HTTP to WebSocket: `ws://your-pod-id-8000.proxy.runpod.net/ws`

### 3.2 Test the connection
You can test if Unmute is running by visiting the HTTP URL in your browser. You should see the Unmute web interface.

## Step 4: Configure your React Native App

### 4.1 Update server URL in your app
1. Open your React Native app
2. Go to the Unmute tab
3. Tap the settings icon (gear)
4. Update the "Server URL" field with your RunPod WebSocket URL:
   ```
   ws://your-pod-id-8000.proxy.runpod.net/ws
   ```
5. Save the settings

### 4.2 Test the connection
1. In your app, tap "Connect to Unmute"
2. Check the debug console for connection logs
3. If successful, you should see "Connected • Real-time Voice"

## Step 5: Troubleshooting

### Common Issues:

#### Connection Failed
- **Check URL format**: Make sure you're using `ws://` not `https://`
- **Check port**: Default is 8000, but RunPod might use 80
- **Check firewall**: Ensure RunPod allows WebSocket connections

#### Services not starting
- **GPU memory**: Make sure you have enough GPU memory (16GB recommended)
- **Check logs**: Use `docker compose logs` to see what's failing
- **Restart services**: Try `docker compose down` then `docker compose up --build`

#### Audio not working
- **Check permissions**: Make sure your app has microphone permissions
- **Check format**: Unmute expects PCM16 audio format
- **Check debug logs**: Look for audio-related errors in the debug console

### Debug Commands:

```bash
# Check running containers
docker ps

# Check logs for specific service
docker compose logs stt
docker compose logs tts
docker compose logs llm

# Restart all services
docker compose down
docker compose up --build

# Check GPU usage
nvidia-smi
```

## Step 6: Production Considerations

### 6.1 Security
- Don't expose your RunPod instance publicly without authentication
- Use HTTPS/WSS in production
- Rotate your Hugging Face tokens regularly

### 6.2 Performance
- Monitor GPU memory usage
- Consider using multiple GPUs for better performance
- Adjust model parameters based on your hardware

### 6.3 Cost Management
- Stop your RunPod instance when not in use
- Monitor your usage and costs
- Consider using spot instances for development

## Example URLs

Here are some example URLs you might use:

```
# Local development
ws://localhost:8000/ws

# RunPod (replace your-pod-id with actual ID)
ws://your-pod-id-8000.proxy.runpod.net/ws

# Custom domain
ws://your-domain.com:80/ws
```

## Support

If you encounter issues:
1. Check the debug console in your React Native app
2. Check Docker logs on your RunPod instance
3. Refer to the [Unmute GitHub repository](https://github.com/kyutai-labs/unmute)
4. Check RunPod documentation for networking issues

## Next Steps

Once everything is working:
1. Experiment with different voices and settings
2. Try different system instructions
3. Monitor performance and costs
4. Consider setting up HTTPS for production use