#!/bin/bash

# Simple Football AI Chatbot Startup Script

echo "🚀 Starting Football AI Chatbot..."

# Check if .env file exists
if [ ! -f "./backend/.env" ]; then
    echo "❌ Error: .env file not found in backend directory"
    echo "Please make sure backend/.env exists with your GEMINI_API_KEY"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Start backend server
echo "Starting Flask backend on port 5001..."
python app.py &
BACKEND_PID=$!

cd ..

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo ""
echo "✅ Servers started successfully!"
echo "🌐 Frontend: http://localhost:8000"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on interrupt
trap cleanup INT

# Wait for interrupt
wait