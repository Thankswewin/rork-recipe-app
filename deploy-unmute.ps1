# RunPod Unmute.sh Deployment Script
# This script sets up unmute.sh on a RunPod GPU instance for the multimodal AI recipe chat app

param(
    [Parameter(Mandatory=$false)]
    [string]$PodId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RunPodApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSetup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput = $false
)

# Configuration
$UNMUTE_REPO = "https://github.com/kyutai-labs/unmute.git"
$DOCKER_IMAGE = "pytorch/pytorch:2.1.0-cuda12.1-cudnn8-devel"
$UNMUTE_PORT = 8000
$WEBSOCKET_PORT = 8000

# Helper functions for colored output

function Write-Header {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Cyan
}

# Check if running on Windows
if ($PSVersionTable.PSVersion.Major -ge 6 -and $PSVersionTable.Platform -and $PSVersionTable.Platform -ne "Win32NT") {
    Write-Error "This script is designed for Windows with WSL2. Please run on Windows."
    exit 1
}
# For Windows PowerShell 5.x, PSVersionTable.Platform doesn't exist, so we assume Windows

# Check if WSL2 is available
function Test-WSL2 {
    try {
        $wslVersion = wsl --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "WSL2 is available"
            return $true
        }
    } catch {
        Write-Error "WSL2 is not available. Please install WSL2 first."
        return $false
    }
    return $false
}

# Install WSL2 if not available
function Install-WSL2 {
    Write-Header "Installing WSL2"
    
    try {
        # Enable WSL feature
        dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
        dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
        
        Write-Warning "WSL2 features enabled. Please restart your computer and run this script again."
        Write-Info "After restart, run: wsl --install -d Ubuntu"
        exit 0
    } catch {
        Write-Error "Failed to install WSL2 features: $_"
        exit 1
    }
}

# Generate RunPod deployment script
function Generate-RunPodScript {
    Write-Header "Generating RunPod Deployment Script"
    
    $runpodScript = @'
#!/bin/bash
# RunPod Unmute.sh Setup Script
# This script sets up unmute.sh on a RunPod GPU instance

set -e

echo "🚀 Starting Unmute.sh setup on RunPod..."

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "📦 Installing dependencies..."
apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    python3-pip \
    python3-dev \
    ffmpeg \
    portaudio19-dev \
    libsndfile1-dev \
    nodejs \
    npm

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone unmute repository
echo "📥 Cloning unmute.sh repository..."
cd /workspace
if [ -d "unmute" ]; then
    rm -rf unmute
fi
git clone https://github.com/kyutai-labs/unmute.git
cd unmute

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
# Unmute Configuration for Recipe Chat App
UNMUTE_HOST=0.0.0.0
UNMUTE_PORT=8000
UNMUTE_WEBSOCKET_PORT=8000

# Model Configuration
MODEL_NAME=kyutai/moshi-1-7b-8kHz
DEVICE=cuda
TORCH_DTYPE=float16

# Voice Configuration
DEFAULT_VOICE=alloy
VOICE_SPEED=1.0
VOICE_PITCH=0.0

# Chat Configuration
SYSTEM_PROMPT="You are Chef Adunni, a friendly Nigerian cuisine expert and cooking assistant. You help users with recipes, cooking techniques, and ingredient analysis. You are encouraging, knowledgeable, and passionate about food. Respond naturally and conversationally."
MAX_TOKENS=150
TEMPERATURE=0.8

# Performance Settings
MAX_CONCURRENT_SESSIONS=10
AUDIO_CHUNK_SIZE=1024
SAMPLE_RATE=24000

# Logging
LOG_LEVEL=INFO
ENABLE_DEBUG=false
EOF

# Create Docker Compose file for RunPod
echo "🐳 Creating Docker Compose configuration..."
cat > docker-compose.runpod.yml << EOF
version: '3.8'

services:
  unmute:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
      - "8001:8001"  # WebSocket port
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs
      - ./.env:/app/.env
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - unmute
    restart: unless-stopped
EOF

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
mkdir -p nginx
cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream unmute_backend {
        server unmute:8000;
    }

    map \$http_upgrade \$connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name _;

        # WebSocket support
        location /ws {
            proxy_pass http://unmute_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 86400;
        }

        # HTTP API
        location / {
            proxy_pass http://unmute_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check
        location /health {
            proxy_pass http://unmute_backend/health;
        }
    }
}
EOF

# Create startup script
echo "🚀 Creating startup script..."
cat > start-unmute.sh << EOF
#!/bin/bash
set -e

echo "🚀 Starting Unmute.sh services..."

# Pull latest images
docker-compose -f docker-compose.runpod.yml pull

# Start services
docker-compose -f docker-compose.runpod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:8000/health; then
    echo "✅ Unmute.sh is running successfully!"
    echo "📡 WebSocket URL: ws://\$(curl -s ifconfig.me):80/ws"
    echo "🌐 HTTP API: http://\$(curl -s ifconfig.me):80"
else
    echo "❌ Service health check failed"
    docker-compose -f docker-compose.runpod.yml logs
    exit 1
fi
EOF

chmod +x start-unmute.sh

# Create stop script
cat > stop-unmute.sh << EOF
#!/bin/bash
echo "🛑 Stopping Unmute.sh services..."
docker-compose -f docker-compose.runpod.yml down
echo "✅ Services stopped"
EOF

chmod +x stop-unmute.sh

# Create logs script
cat > logs-unmute.sh << EOF
#!/bin/bash
echo "📋 Unmute.sh service logs:"
docker-compose -f docker-compose.runpod.yml logs -f
EOF

chmod +x logs-unmute.sh

# Build and start services
echo "🔨 Building and starting services..."
./start-unmute.sh

echo "🎉 Unmute.sh setup completed successfully!"
echo ""
echo "📋 Management Commands:"
echo "  Start:  ./start-unmute.sh"
echo "  Stop:   ./stop-unmute.sh"
echo "  Logs:   ./logs-unmute.sh"
echo ""
echo "🔗 Connection URLs:"
echo "  WebSocket: ws://$(curl -s ifconfig.me):80/ws"
echo "  HTTP API:  http://$(curl -s ifconfig.me):80"
echo ""
echo "📱 Use these URLs in your React Native app's RunPod setup!"
'@

    # Save the script
    $scriptPath = "./runpod-setup.sh"
    $runpodScript | Out-File -FilePath $scriptPath -Encoding UTF8
    
    Write-Success "RunPod setup script generated: $scriptPath"
    return $scriptPath
}

# Generate RunPod deployment instructions
function Generate-DeploymentInstructions {
    Write-Header "Generating Deployment Instructions"
    
    $instructions = @'
# RunPod Unmute.sh Deployment Instructions

## Prerequisites
1. RunPod account with GPU credits
2. Basic familiarity with RunPod interface
3. SSH client (built into Windows 10/11)

## Step 1: Create RunPod Instance

1. Go to [RunPod.io](https://runpod.io) and sign in
2. Click "Deploy" → "GPU Pods"
3. Choose a GPU instance (recommended: RTX 4090 or A100)
4. Select template: "PyTorch 2.1" or "CUDA Development"
5. Configure:
   - Container Disk: 50GB minimum
   - Volume: 20GB (optional, for model storage)
   - Ports: 8000, 80 (HTTP), 22 (SSH)
6. Click "Deploy On-Demand"

## Step 2: Connect to Your Pod

1. Wait for pod to be "Running"
2. Click "Connect" → "SSH Terminal"
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
🔗 Connection URLs:
  WebSocket: ws://your-pod-id:80/ws
  HTTP API:  http://your-pod-id:80
```

## Step 5: Configure Your App

1. Open your React Native app
2. Go to Settings → Unmute Configuration
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
'@

    $instructionsPath = "./RUNPOD_DEPLOYMENT.md"
    $instructions | Out-File -FilePath $instructionsPath -Encoding UTF8
    
    Write-Success "Deployment instructions generated: $instructionsPath"
    return $instructionsPath
}

# Main execution
function Main {
    Write-Header "RunPod Unmute.sh Deployment Setup"
    Write-Info "This script prepares deployment files for unmute.sh on RunPod"
    
    if (-not $SkipSetup) {
        # Check WSL2
        if (-not (Test-WSL2)) {
            Write-Warning "WSL2 not found. Installing..."
            Install-WSL2
        }
    }
    
    # Generate deployment files
    $scriptPath = Generate-RunPodScript
    $instructionsPath = Generate-DeploymentInstructions
    
    Write-Header "Deployment Files Generated"
    Write-Success "Setup script: $scriptPath"
    Write-Success "Instructions: $instructionsPath"
    
    Write-Header "Next Steps"
    Write-Info "1. Create a RunPod GPU instance"
    Write-Info "2. Upload and run the setup script: $scriptPath"
    Write-Info "3. Follow the instructions in: $instructionsPath"
    Write-Info "4. Configure your React Native app with the WebSocket URL"
    
    if ($PodId) {
        Write-Header "Quick Setup for Pod: $PodId"
        $wsUrl = "ws://$PodId-8000.proxy.runpod.net/ws"
        Write-Info "Your WebSocket URL will be: $wsUrl"
        Write-Info "Use this URL in your app's RunPod setup helper"
    }
    
    Write-Header "Deployment Complete"
    Write-Success "All deployment files are ready!"
}

# Run main function
Main