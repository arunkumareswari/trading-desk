#!/bin/bash
# ============================================================
# Trading Journal — Google Cloud Deploy Script
# Run this on your Google Cloud e2-micro VM
# Usage: bash deploy.sh
# ============================================================

set -e  # Exit on any error

echo "====================================================="
echo " Trading Journal — Google Cloud Deployment"
echo "====================================================="

# --- Step 1: Install Docker if not present ---
if ! command -v docker &>/dev/null; then
    echo ""
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. You may need to log out and back in."
fi

# --- Step 2: Install Docker Compose plugin if not present ---
if ! docker compose version &>/dev/null 2>&1; then
    echo ""
    echo "📦 Installing Docker Compose..."
    sudo apt-get update -y
    sudo apt-get install -y docker-compose-plugin
fi

echo ""
echo "✅ Docker: $(docker --version)"
echo "✅ Compose: $(docker compose version)"

# --- Step 3: Pull latest code ---
echo ""
echo "📥 Pulling latest code from git..."
if [ -d ".git" ]; then
    git pull origin main
else
    echo "⚠️  No git repo found. Make sure you're in the project directory."
fi

# --- Step 4: Build and start ---
echo ""
echo "🔨 Building Docker image..."
docker compose build --no-cache

echo ""
echo "🚀 Starting Trading Journal..."
docker compose up -d

# --- Step 5: Show status ---
echo ""
echo "⏳ Waiting for app to start..."
sleep 5

echo ""
docker compose ps

echo ""
echo "====================================================="
EXTERNAL_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "YOUR_SERVER_IP")
echo " ✅ Trading Journal is LIVE!"
echo " 🌐 Access it at: http://$EXTERNAL_IP:3000"
echo " 📊 MT5 Webhook URL: http://$EXTERNAL_IP:3000/api/webhooks/mt5"
echo "====================================================="
echo ""
echo "📋 Useful commands:"
echo "   docker compose logs -f       (view live logs)"
echo "   docker compose down          (stop)"
echo "   docker compose restart       (restart)"
echo "   bash deploy.sh               (re-deploy with latest code)"
