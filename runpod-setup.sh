#!/bin/bash
# RunPod Unmute.sh Setup Script
# This script sets up unmute.sh on a RunPod GPU instance

set -e

echo "ðŸš€ Starting Unmute.sh setup on RunPod..."

# Update system
echo "ðŸ“¦ Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "ðŸ“¦ Installing dependencies..."
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
    echo "ðŸ³ Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "ðŸ³ Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone unmute repository
echo "ðŸ“¥ Cloning unmute.sh repository..."
cd /workspace
if [ -d "unmute" ]; then
    rm -rf unmute
fi
git clone https://github.com/kyutai-labs/unmute.git
cd unmute

# Create environment file
echo "âš™ï¸ Creating environment configuration..."
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
echo "ðŸ³ Creating Docker Compose configuration..."
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
echo "ðŸŒ Creating Nginx configuration..."
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
echo "ðŸš€ Creating startup script..."
cat > start-unmute.sh << EOF
#!/bin/bash
set -e

echo "ðŸš€ Starting Unmute.sh services..."

# Pull latest images
docker-compose -f docker-compose.runpod.yml pull

# Start services
docker-compose -f docker-compose.runpod.yml up -d

# Wait for services to be ready
echo "â³ Waiting for services to start..."
sleep 30

# Check health
echo "ðŸ” Checking service health..."
if curl -f http://localhost:8000/health; then
    echo "âœ… Unmute.sh is running successfully!"
    echo "ðŸ“¡ WebSocket URL: ws://\$(curl -s ifconfig.me):80/ws"
    echo "ðŸŒ HTTP API: http://\$(curl -s ifconfig.me):80"
else
    echo "âŒ Service health check failed"
    docker-compose -f docker-compose.runpod.yml logs
    exit 1
fi
EOF

chmod +x start-unmute.sh

# Create stop script
cat > stop-unmute.sh << EOF
#!/bin/bash
echo "ðŸ›‘ Stopping Unmute.sh services..."
docker-compose -f docker-compose.runpod.yml down
echo "âœ… Services stopped"
EOF

chmod +x stop-unmute.sh

# Create logs script
cat > logs-unmute.sh << EOF
#!/bin/bash
echo "ðŸ“‹ Unmute.sh service logs:"
docker-compose -f docker-compose.runpod.yml logs -f
EOF

chmod +x logs-unmute.sh

# Build and start services
echo "ðŸ”¨ Building and starting services..."
./start-unmute.sh

echo "ðŸŽ‰ Unmute.sh setup completed successfully!"
echo ""
echo "ðŸ“‹ Management Commands:"
echo "  Start:  ./start-unmute.sh"
echo "  Stop:   ./stop-unmute.sh"
echo "  Logs:   ./logs-unmute.sh"
echo ""
echo "ðŸ”— Connection URLs:"
echo "  WebSocket: ws://$(curl -s ifconfig.me):80/ws"
echo "  HTTP API:  http://$(curl -s ifconfig.me):80"
echo ""
echo "ðŸ“± Use these URLs in your React Native app's RunPod setup!"
