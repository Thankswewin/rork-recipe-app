# Unmute Integration Guide for RORK Recipe App

This guide will help you set up and integrate the Unmute voice assistant backend with your RORK Recipe App.

## 🚀 Quick Start

### Prerequisites
- Windows 11 with WSL2
- Docker Desktop with WSL2 integration
- RTX 3080 or compatible GPU (optional, will fallback to CPU)
- Hugging Face account and token (optional for enhanced features)

### 1. Deploy Unmute Backend

Run the automated deployment script:

```powershell
# Basic deployment (CPU mode)
.\deploy-unmute.ps1

# With Hugging Face token for enhanced AI features
.\deploy-unmute.ps1 -HuggingFaceToken "hf_your_token_here"

# Setup only (don't start services)
.\deploy-unmute.ps1 -LocalOnly
```

### 2. Configure the App

1. **Start the RORK Recipe App**:
   ```bash
   npm start
   ```

2. **Open the app** in your browser or Expo Go

3. **Navigate to the Unmute tab**

4. **Configure the server**:
   - Tap the "Server Setup" button
   - Select "Local Server"
   - The URL will be set to `ws://localhost:8000/ws`
   - Tap "Set URL"

5. **Test the connection**:
   - Tap "Connect" in the Unmute interface
   - Wait for the "Connected • Real-time Voice" status
   - Try speaking or use the microphone button

## 🔧 Advanced Configuration

### Hugging Face Setup

1. **Create account** at [huggingface.co](https://huggingface.co)
2. **Accept the Mistral model** at [Mistral Small 3.2 24B](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506)
3. **Create access token** with "Read access to contents of all public gated repos"
4. **Use token in deployment**:
   ```powershell
   .\deploy-unmute.ps1 -HuggingFaceToken "hf_your_token_here"
   ```

### Nigerian Cuisine Configuration

The deployment script automatically configures Unmute with Nigerian cuisine expertise:

- **Chef Mama personality**: Warm Nigerian grandmother cooking expert
- **Specialties**: Jollof rice, Egusi soup, Pounded yam, Moin moin, Suya, Pepper soup
- **Cultural context**: Yoruba, Igbo, and Hausa cooking terms
- **Measurements**: Both metric and traditional Nigerian units
- **Voice settings**: Optimized for cooking guidance

### RunPod Integration

For cloud deployment using RunPod:

1. **Set up RunPod instance** with GPU
2. **Deploy Unmute** on your RunPod instance
3. **Configure in app**:
   - Open RunPod Setup Helper
   - Select "RunPod Instance"
   - Enter your Pod ID (e.g., `abc123def456`)
   - The URL will be generated automatically

## 🛠️ Management Commands

### Service Management
```powershell
# Check service status
.\deploy-unmute.ps1 status

# Start services
.\deploy-unmute.ps1 start

# Stop services
.\deploy-unmute.ps1 stop

# View logs
.\deploy-unmute.ps1 logs
```

### Manual Commands (in WSL2)
```bash
# Navigate to Unmute directory
cd ~/unmute

# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check GPU usage
nvidia-smi
```

## 🔍 Troubleshooting

### Common Issues

#### 1. WSL2 Not Found
```powershell
# Install WSL2 (requires Administrator)
wsl --install -d Ubuntu
# Restart computer after installation
```

#### 2. Docker Not Running
- Start Docker Desktop
- Ensure WSL2 integration is enabled in Docker settings

#### 3. GPU Not Detected
```bash
# Check GPU in WSL2
nvidia-smi

# Install NVIDIA Container Toolkit if needed
sudo apt update
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-docker2
sudo systemctl restart docker
```

#### 4. Connection Failed in App
- Verify Unmute services are running: `.\deploy-unmute.ps1 status`
- Check if port 8000 is accessible: `curl http://localhost:8000/health`
- Restart services: `.\deploy-unmute.ps1 stop` then `.\deploy-unmute.ps1 start`

#### 5. Poor Voice Quality
- Check microphone permissions in browser
- Ensure stable internet connection
- Try adjusting voice settings in the app

### Performance Optimization

#### For RTX 3080
- GPU memory utilization is set to 80% by default
- Model length is optimized for cooking conversations (4096 tokens)
- Services are configured to use GPU acceleration

#### For CPU-only Systems
- Unmute will automatically fallback to CPU mode
- Response times will be slower but functional
- Consider using a smaller model for better performance

## 📱 App Integration Features

### Voice Chat Interface
- **Real-time voice conversation** with Chef Mama
- **Push-to-talk** or continuous listening modes
- **Text input** as alternative to voice
- **Message history** with timestamps
- **Debug panel** for troubleshooting

### Nigerian Cuisine Expertise
- **Traditional recipes** with cultural context
- **Ingredient substitutions** for diaspora cooking
- **Cooking techniques** passed down through generations
- **Multi-language support** for Nigerian cooking terms
- **Measurement conversions** between metric and traditional units

### Error Handling
- **Connection status indicators**
- **Automatic reconnection** on network issues
- **Detailed error messages** with suggested solutions
- **Debug logging** for technical troubleshooting

## 🔐 Security Considerations

- **Local deployment** keeps voice data on your machine
- **CORS configuration** restricts access to your app
- **No data persistence** by default (conversations are not stored)
- **Hugging Face token** is stored locally in WSL2 environment

## 📈 Next Steps

1. **Test basic voice interaction** with simple cooking questions
2. **Try Nigerian recipe requests** to test cultural knowledge
3. **Experiment with voice settings** for optimal experience
4. **Integrate with recipe creation** workflow in the app
5. **Set up RunPod deployment** for cloud-based usage

## 🆘 Support

If you encounter issues:

1. **Check the debug panel** in the Unmute interface
2. **Review service logs**: `.\deploy-unmute.ps1 logs`
3. **Verify system requirements** are met
4. **Restart services** if needed
5. **Check the troubleshooting section** above

For additional help, refer to:
- `unmute-deployment-checklist.md` - Detailed deployment requirements
- `unmute-deployment-guide.md` - Step-by-step setup instructions
- Unmute GitHub repository - Latest documentation and issues

---

**Happy cooking with Chef Mama! 🍲👩‍🍳**