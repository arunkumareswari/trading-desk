#!/bin/bash
# ============================================================
# Trading Journal — MT5 Python Bridge Launcher
# For: Laptop (Windows Git Bash / Mac / Linux)
# Usage: bash start_mt5_sync.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "====================================================="
echo " MT5 Trading Journal — Python Direct Sync Bridge"
echo "====================================================="
echo ""

# Check Python
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "❌ Python not found! Please install Python 3.8+ from https://python.org"
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi

echo "✅ Python found: $($PYTHON_CMD --version)"

# Check pip install
echo ""
echo "📦 Checking required packages..."
$PYTHON_CMD -c "import MetaTrader5, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Missing packages. Installing now..."
    $PYTHON_CMD -m pip install MetaTrader5 requests
    echo ""
fi

echo "🚀 Starting MT5 Sync Bridge..."
echo "   Press Ctrl+C to stop."
echo ""

$PYTHON_CMD mt5_sync.py

echo ""
echo "🛑 MT5 Sync Bridge stopped."
