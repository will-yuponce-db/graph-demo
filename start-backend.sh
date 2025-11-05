#!/bin/bash

echo "🚀 Starting Graph Editor Backend..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if database exists
if [ ! -f "db/graph.db" ]; then
    echo "🌱 Database not found. Seeding with initial data..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "❌ Failed to seed database"
        exit 1
    fi
fi

echo ""
echo "✓ Backend ready!"
echo "✓ Starting server on http://localhost:3000"
echo ""

# Start the server
npm start

