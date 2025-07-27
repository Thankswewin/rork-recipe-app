# Unmute Deployment Script for Windows with WSL2
# This script automates the deployment of Unmute backend for the RORK Recipe App

param(
    [string]$HuggingFaceToken = "",
    [switch]$SkipPrerequisites = $false,
    [switch]$LocalOnly = $false
)

# Color functions for better output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Main deployment function
function Deploy-Unmute {
    Write-Info "🚀 Starting Unmute Deployment for RORK Recipe App"
    Write-Info "================================================="
    
    # Check prerequisites
    if (-not $SkipPrerequisites) {
        Write-Info "📋 Checking prerequisites..."
        
        # Check if WSL2 is installed
        try {
            $wslVersion = wsl --version 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "WSL2 not found. Installing WSL2..."
                if (-not (Test-Administrator)) {
                    Write-Error "Administrator privileges required to install WSL2. Please run as Administrator."
                    return
                }
                wsl --install -d Ubuntu
                Write-Warning "WSL2 installation initiated. Please restart your computer and run this script again."
                return
            }
            Write-Success "✅ WSL2 is installed"
        }
        catch {
            Write-Error "Failed to check WSL2 status: $_"
            return
        }
        
        # Check if Docker Desktop is running
        try {
            $dockerStatus = docker version 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Docker Desktop is not running. Please start Docker Desktop and try again."
                return
            }
            Write-Success "✅ Docker Desktop is running"
        }
        catch {
            Write-Error "Docker Desktop not found. Please install Docker Desktop with WSL2 integration."
            return
        }
        
        # Check GPU access (optional)
        try {
            $gpuCheck = wsl nvidia-smi 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "✅ GPU access available in WSL2"
            } else {
                Write-Warning "⚠️  GPU access not detected. Unmute will run in CPU mode."
            }
        }
        catch {
            Write-Warning "⚠️  Could not check GPU status. Continuing with deployment."
        }
    }
    
    # Setup Unmute in WSL2
    Write-Info "🔧 Setting up Unmute in WSL2..."
    
    # Create setup script for WSL2
    $wslSetupScript = @'
#!/bin/bash
set -e

echo "🔧 Setting up Unmute in WSL2..."

# Update system
sudo apt update

# Install required packages
sudo apt install -y curl git

# Clone Unmute repository
cd ~
if [ -d "unmute" ]; then
    echo "📁 Unmute directory exists, updating..."
    cd unmute
    git pull origin main
else
    echo "📥 Cloning Unmute repository..."
    git clone https://github.com/kyutai-labs/unmute.git
    cd unmute
fi

# Setup Hugging Face token if provided
if [ ! -z "$1" ]; then
    echo "🔑 Setting up Hugging Face token..."
    echo "export HUGGING_FACE_HUB_TOKEN=$1" >> ~/.bashrc
    export HUGGING_FACE_HUB_TOKEN=$1
fi

# Create docker-compose.override.yml for optimized settings
echo "⚙️  Creating Docker Compose override..."
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  llm:
    environment:
      - MODEL=mistralai/Mistral-Small-3.2-24B-Instruct-2506
      - MAX_MODEL_LEN=4096
      - GPU_MEMORY_UTILIZATION=0.8
      - TRUST_REMOTE_CODE=true
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

  backend:
    environment:
      - CORS_ORIGINS=http://localhost:8081,http://localhost:19006,exp://192.168.*:19000
EOF

# Create Nigerian cuisine configuration
echo "🍲 Setting up Nigerian cuisine configuration..."
mkdir -p config
cat > config/nigerian_cuisine.yaml << 'EOF'
system_prompts:
  cooking_assistant: |
    You are Chef Mama, a warm and knowledgeable Nigerian grandmother who is an expert in traditional and modern Nigerian cuisine.
    
    Your specialties include:
    - Jollof rice (the best in West Africa!)
    - Egusi soup with various proteins
    - Pounded yam and other swallow foods
    - Moin moin (steamed bean pudding)
    - Suya and other grilled meats
    - Pepper soup varieties
    - Nigerian stews and sauces
    - Traditional snacks and desserts
    
    Always:
    - Provide measurements in both metric and traditional Nigerian units (cups, handfuls, etc.)
    - Use encouraging, motherly language
    - Share cultural context and family traditions
    - Understand Yoruba, Igbo, and Hausa cooking terms
    - Suggest ingredient substitutions for diaspora cooking
    - Include cooking tips and techniques passed down through generations
    
    Respond naturally and conversationally, as if teaching a beloved grandchild.

voice_settings:
  default_voice: "alloy"
  speaking_rate: 0.9
  pitch: 0.1
EOF

echo "✅ Unmute setup completed successfully!"
echo "📍 Location: ~/unmute"
echo "🔧 Configuration: docker-compose.override.yml created"
echo "🍲 Nigerian cuisine config: config/nigerian_cuisine.yaml created"
'@
    
    # Write setup script to temp file
    $tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
    $wslSetupScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Execute setup script in WSL2
    try {
        Write-Info "📥 Cloning and configuring Unmute..."
        wsl bash $tempScript $HuggingFaceToken
        Write-Success "✅ Unmute setup completed in WSL2"
    }
    catch {
        Write-Error "Failed to setup Unmute in WSL2: $_"
        return
    }
    finally {
        # Clean up temp file
        if (Test-Path $tempScript) {
            Remove-Item $tempScript
        }
    }
    
    # Start Unmute services
    if (-not $LocalOnly) {
        Write-Info "🚀 Starting Unmute services..."
        try {
            wsl bash -c "cd ~/unmute && docker compose up -d --build"
            Write-Success "✅ Unmute services started successfully!"
            
            # Wait for services to be ready
            Write-Info "⏳ Waiting for services to be ready..."
            Start-Sleep -Seconds 30
            
            # Test connection
            Write-Info "🔍 Testing Unmute connection..."
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Success "✅ Unmute backend is responding!"
                } else {
                    Write-Warning "⚠️  Unmute backend may still be starting up..."
                }
            }
            catch {
                Write-Warning "⚠️  Could not test connection. Services may still be starting."
            }
        }
        catch {
            Write-Error "Failed to start Unmute services: $_"
            Write-Info "💡 You can manually start services with: wsl bash -c 'cd ~/unmute && docker compose up -d --build'"
        }
    }
    
    # Display next steps
    Write-Info ""
    Write-Success "🎉 Unmute Deployment Complete!"
    Write-Info "================================"
    Write-Info "📍 Unmute Location: ~/unmute (in WSL2)"
    Write-Info "🌐 Backend URL: http://localhost:8000"
    Write-Info "🔌 WebSocket URL: ws://localhost:8000/ws"
    Write-Info ""
    Write-Info "📱 Next Steps:"
    Write-Info "1. Open the RORK Recipe App"
    Write-Info "2. Go to the Unmute tab"
    Write-Info "3. Use the RunPod Setup Helper to set server to 'Local'"
    Write-Info "4. Test the voice connection"
    Write-Info ""
    Write-Info "🔧 Useful Commands:"
    Write-Info "• Start services: wsl bash -c 'cd ~/unmute && docker compose up -d'"
    Write-Info "• Stop services: wsl bash -c 'cd ~/unmute && docker compose down'"
    Write-Info "• View logs: wsl bash -c 'cd ~/unmute && docker compose logs -f'"
    Write-Info "• Check status: wsl bash -c 'cd ~/unmute && docker compose ps'"
    
    if ($HuggingFaceToken) {
        Write-Info ""
        Write-Success "🔑 Hugging Face token configured successfully!"
    } else {
        Write-Info ""
        Write-Warning "⚠️  No Hugging Face token provided. You may need to set it manually for full functionality."
        Write-Info "💡 Add token with: wsl bash -c 'echo \"export HUGGING_FACE_HUB_TOKEN=your_token\" >> ~/.bashrc'"
    }
}

# Script execution
if ($args.Count -eq 0 -or $args[0] -eq "deploy") {
    Deploy-Unmute
} elseif ($args[0] -eq "status") {
    Write-Info "📊 Checking Unmute status..."
    try {
        wsl bash -c "cd ~/unmute && docker compose ps"
    }
    catch {
        Write-Error "Failed to check status. Make sure Unmute is deployed."
    }
} elseif ($args[0] -eq "stop") {
    Write-Info "🛑 Stopping Unmute services..."
    try {
        wsl bash -c "cd ~/unmute && docker compose down"
        Write-Success "✅ Unmute services stopped"
    }
    catch {
        Write-Error "Failed to stop services: $_"
    }
} elseif ($args[0] -eq "start") {
    Write-Info "🚀 Starting Unmute services..."
    try {
        wsl bash -c "cd ~/unmute && docker compose up -d"
        Write-Success "✅ Unmute services started"
    }
    catch {
        Write-Error "Failed to start services: $_"
    }
} elseif ($args[0] -eq "logs") {
    Write-Info "📋 Showing Unmute logs..."
    try {
        wsl bash -c "cd ~/unmute && docker compose logs -f"
    }
    catch {
        Write-Error "Failed to show logs: $_"
    }
} else {
    Write-Info "🔧 Unmute Deployment Script for RORK Recipe App"
    Write-Info "================================================"
    Write-Info ""
    Write-Info "Usage:"
    Write-Info "  .\deploy-unmute.ps1 [command] [options]"
    Write-Info ""
    Write-Info "Commands:"
    Write-Info "  deploy    Deploy Unmute backend (default)"
    Write-Info "  status    Check service status"
    Write-Info "  start     Start services"
    Write-Info "  stop      Stop services"
    Write-Info "  logs      View service logs"
    Write-Info ""
    Write-Info "Options:"
    Write-Info "  -HuggingFaceToken <token>    Set Hugging Face token"
    Write-Info "  -SkipPrerequisites          Skip prerequisite checks"
    Write-Info "  -LocalOnly                  Setup only, don't start services"
    Write-Info ""
    Write-Info "Examples:"
    Write-Info "  .\deploy-unmute.ps1 deploy -HuggingFaceToken hf_your_token_here"
    Write-Info "  .\deploy-unmute.ps1 status"
    Write-Info "  .\deploy-unmute.ps1 logs"
}