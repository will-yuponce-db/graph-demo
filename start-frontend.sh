#!/bin/bash

echo "🎨 Starting Graph Editor Frontend..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "✓ Frontend ready!"
echo "✓ Starting dev server..."
echo ""
echo "💡 Make sure the backend is running in another terminal!"
echo "   Run: ./start-backend.sh"
echo ""

# Start the dev server
npm run dev

