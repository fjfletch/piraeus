#!/bin/bash

# Startup script for MCP Factor Backend Server

echo "🚀 Starting MCP Factor Backend Server..."
echo ""

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY environment variable is not set!"
    echo "   The workflow endpoint will not work without it."
    echo ""
    echo "   To set it, run:"
    echo "   export OPENAI_API_KEY='your-key-here'"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📦 Installing/updating dependencies..."
python3 -m pip install -e . --quiet

echo ""
echo "✅ Starting server on http://localhost:8000"
echo "   - API docs: http://localhost:8000/docs"
echo "   - Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python3 -m uvicorn dynamic_tools.api.app:app --reload --host 0.0.0.0 --port 8000
