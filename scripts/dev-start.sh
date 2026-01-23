#!/bin/bash

# Define ports
FRONTEND_PORT=9229
BACKEND_PORT=8000

echo "🔍 Checking for processes on ports..."

# Function to kill process on port
kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port)
  if [ -n "$pid" ]; then
    echo "⚠️  Port $port is in use by PID $pid. Killing it..."
    kill -9 $pid
    echo "✅ Process on port $port killed."
  else
    echo "✅ Port $port is free."
  fi
}

kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT

# Clean Next.js lock file if it exists
if [ -f ".next/dev/lock" ]; then
  echo "🧹 Cleaning .next/dev/lock..."
  rm .next/dev/lock
fi

echo "🚀 Starting Next.js Dev Server with TurboPack..."
# Using exec so the new process takes over the shell (signals pass through)
exec npx next dev -p $FRONTEND_PORT --turbo
